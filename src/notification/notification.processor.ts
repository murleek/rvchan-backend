import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Notification, NotificationType } from './types/notification.types';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  constructor(
    @InjectRepository(NotificationEntity)
    private repo: Repository<NotificationEntity>,
    private gateway: WebsocketGateway,
  ) {
    super();
  }

  async process(job: Job<Notification>) {
    try {
      const { type, recipientId, actorId, payload } = job.data;

      const groupKey = this.buildGroupKey(type, recipientId, payload);

      let notificationId: string;

      // НЕ агрегируем new_device
      if (type === 'new_device') {
        const notification = await this.repo.save({
          type,
          groupKey,
          recipient: { id: recipientId },
          payload,
        });
        notificationId = notification.id;
      } else {
        const saved = await this.repo.save({
          type,
          recipient: { id: recipientId },
          actor: actorId ? { id: actorId } : undefined,
          groupKey,
          count: 1,
          actors: actorId ? [actorId] : [],
          payload,
        });
        notificationId = saved.id;
      }

      // const existing = await this.repo.findOne({
      //   where: {
      //     groupKey,
      //     recipient: { id: recipientId },
      //     isRead: false,
      //     createdAt: MoreThan(new Date(Date.now() - 5 * 60 * 1000)),
      //   },
      // });

      // if (existing) {
      //   const actors = this.mergeActors(existing.actors, actorId);

      //   await this.repo.save({
      //     ...existing,
      //     count: existing.count + 1,
      //     actors,
      //   });
      // } else {
      // }

      const notification = await this.repo.findOne({
        where: {
          id: notificationId,
        },
        relations: ['recipient', 'actor'],
      });

      if (!notification) {
        throw new Error('Notification not found after saving');
      }

      await this.gateway.notifyNew({ notification });
    } catch (error) {
      console.error('Error processing notification job:', error);
      throw error; // Rethrow to let BullMQ handle retries
    }
  }

  private buildGroupKey(
    type: NotificationType,
    recipientId: number,
    payload?: any,
  ) {
    switch (type) {
      case 'follow':
        return `follow:${recipientId}`;

      case 'follow_accepted':
        return `follow_accepted:${recipientId}`;

      case 'new_device':
        return `new_device:${recipientId}:${payload?.device.deviceId}`;

      case 'post_mention':
        return `post_mention:${recipientId}:${payload?.username}:${payload?.postId}`;

      case 'post_reply':
        return `post_reply:${recipientId}:${payload?.username}:${payload?.postId}`;

      case 'post_reply_to_other':
        return `post_reply_to_other:${recipientId}:${payload?.username}:${payload?.postId}`;
    }
  }

  private mergeActors(existing: number[], actor: number) {
    if (!actor) return existing;

    const set = new Set<number>([actor, ...existing]);
    return Array.from(set).slice(0, 5);
  }
}
