import { NotificationEntity } from '../entities/notification.entity';
import { Notification } from '../dto/notification.dto';

export class NotificationMapper {
  static toPublic(notification: NotificationEntity): Notification {
    return {
      id: notification.id,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
      type: notification.type,
      groupKey: notification.groupKey,
      count: notification.count,
      payload: notification.payload,
      actor: notification.actor
        ? {
            id: notification.actor?.id,
            firstName: notification.actor?.firstName,
            lastName: notification.actor?.lastName,
            username: notification.actor?.username,
            avatarUrl: notification.actor?.avatarUrl,
          }
        : undefined,
      recipient: {
        id: notification.recipient.id,
        firstName: notification.recipient.firstName,
        lastName: notification.recipient.lastName,
        username: notification.recipient.username,
        avatarUrl: notification.recipient.avatarUrl,
      },
    };
  }
}
