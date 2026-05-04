import { Injectable } from '@nestjs/common';
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

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue('notifications') private queue: Queue,
    @InjectRepository(NotificationEntity)
    private notificationRepo: Repository<NotificationEntity>,
    private readonly sessions: SessionsService,
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

  async newDevice(
    userId: string,
    device: ParsedUserAgent & { deviceId: string },
    ip: string,
  ) {
    await this.queue.add('notify', {
      type: NotificationType.NEW_DEVICE,
      recipientId: userId,
      payload: { device, ip },
    });
  }

  async markAllAsSeen(userId: string, deviceId: string) {
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

  async getNotifications(user: ICurrentUser) {
    const session = await this.sessions.getSession(user.deviceId);

    const qb = this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actor', 'actor')
      .leftJoinAndSelect('notification.recipient', 'recipient')
      .where('recipient.id = :userId', { userId: user.id })
      .andWhere(
        `(
        notification.type != :type
        OR notification.createdAt > :sessionCreatedAt
      )`,
        {
          type: 'new_device',
          sessionCreatedAt: session?.createdAt ?? new Date(0),
        },
      )
      .orderBy('notification.createdAt', 'DESC')
      .take(20);

    const notifications = await qb.getMany();

    return notifications.map(NotificationMapper.toPublic);
  }

  async countUnseenNotifications(userId: number, deviceId: string) {
    const session = await this.sessions.getSession(deviceId);

    return await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.recipient_id = :userId', { userId })
      .andWhere('n.isRead = false')
      .andWhere(`NOT (n.type = :type AND n.createdAt <= :sessionCreatedAt)`, {
        type: 'new_device',
        sessionCreatedAt: session?.createdAt ?? new Date(0),
      })
      .getCount();
  }
}
