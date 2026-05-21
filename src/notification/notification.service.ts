import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationType } from './types/notification.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationMapper } from './mappers/notification.mapper';
import { ParsedUserAgent } from 'src/common/interfaces/user-agent.interface';
import { ICurrentUser } from 'src/user/types/user.types';
import { SessionsService } from 'src/sessions/sessions.service';
import { R2Provider } from 'src/media/r2.provider';
import { PaginationService } from 'src/pagination/pagination.service';
import { CursorPaginationDto } from 'src/pagination/dto/cursor-pagination.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue('notifications') private queue: Queue,
    @InjectRepository(NotificationEntity)
    private notificationRepo: Repository<NotificationEntity>,
    private readonly sessions: SessionsService,
    private readonly cf: R2Provider,
    private readonly pagination: PaginationService,
    @Inject(forwardRef(() => UserService))
    private readonly user: UserService,
  ) {}

  async follow(actorId: string, targetId: string) {
    if (actorId === targetId) return;

    await this.queue.add('notify', {
      type: NotificationType.FOLLOW,
      recipientId: targetId,
      actorId,
    });
  }

  async followAccepted(actorId: string, targetId: string) {
    await this.queue.add('notify', {
      type: NotificationType.FOLLOW_ACCEPTED,
      recipientId: targetId,
      actorId,
    });
  }

  async mentioned(
    actorId: number,
    targetId: number,
    post: { id: number; username: string },
  ) {
    await this.queue.add('notify', {
      type: NotificationType.POST_MENTION,
      recipientId: targetId,
      actorId,
      payload: { postId: post.id, username: post.username },
    });
  }

  async newDevice(
    userId: number,
    device: ParsedUserAgent & { deviceId: string },
    ip: string,
  ) {
    await this.queue.add('notify', {
      type: NotificationType.NEW_DEVICE,
      recipientId: userId,
      payload: { device, ip },
    });
  }

  async markAllAsSeen(userId: number, deviceId: string) {
    const session = await this.sessions.getSession(deviceId);

    await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({
        isRead: true,
      })
      .where('recipient_id = :userId', { userId })
      .andWhere('isRead IS FALSE')
      .andWhere(`NOT (type = :type AND createdAt <= :sessionCreatedAt)`, {
        type: 'new_device',
        sessionCreatedAt: session?.createdAt ?? new Date(0),
      })
      .execute();
  }

  async markAsRead(userId: number, id: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, recipient: { id: userId } },
    });
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.isRead = true;
    await this.notificationRepo.save(notification);
  }

  async getPublicNotification(notification: NotificationEntity) {
    const actor =
      notification.actor &&
      (await this.user.getShortPublicUser(notification.actor));
    const publicNotification = NotificationMapper.toPublic(notification);

    // try {
    //   if (publicNotification.actor?.avatar) {
    //     publicNotification.actor.avatar = await this.cf.getAllDownloadUrl(
    //       publicNotification.actor.avatar as string,
    //     );
    //   }
    // } catch (e) {
    //   console.error('Error fetching avatar URL:', e);
    // }
    return { ...publicNotification, actor };
  }

  async getNotifications(user: ICurrentUser, dto?: CursorPaginationDto) {
    const session = await this.sessions.getSession(user.deviceId);

    const qb = this.notificationRepo
      .createQueryBuilder('entity')
      .leftJoinAndSelect('entity.actor', 'actor')
      .leftJoinAndSelect('entity.recipient', 'recipient')
      .where('recipient.id = :userId', { userId: user.id })
      .andWhere(
        `(
        entity.type != :type
        OR entity.createdAt > :sessionCreatedAt
      )`,
        {
          type: 'new_device',
          sessionCreatedAt: session?.createdAt ?? new Date(0),
        },
      );

    const notifications = await this.pagination.paginate(qb, dto, {
      type: 'cursor',
      cursorField: 'internalId',
      order: 'DESC',
      map: async (n) => await this.getPublicNotification(n),
    });

    return notifications;
  }

  async countUnseenNotifications(userId: number, deviceId: string) {
    const session = await this.sessions.getSession(deviceId);

    return await this.notificationRepo
      .createQueryBuilder('entity')
      .where('entity.recipient_id = :userId', { userId })
      .andWhere('entity.isRead = false')
      .andWhere(
        `NOT (entity.type = :type AND entity.createdAt <= :sessionCreatedAt)`,
        {
          type: 'new_device',
          sessionCreatedAt: session?.createdAt ?? new Date(0),
        },
      )
      .getCount();
  }
}
