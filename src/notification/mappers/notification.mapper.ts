import { NotificationEntity } from '../entities/notification.entity';
import { Notification } from '../dto/notification.dto';
import { ShortPublicUserSchema } from 'src/user/dto/user.dto';

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
        ? ShortPublicUserSchema.parse(notification.actor)
        : undefined,
      recipient: ShortPublicUserSchema.parse({
        id: notification.recipient.id,
        username: notification.recipient.username,
        firstName: notification.recipient.firstName,
        lastName: notification.recipient.lastName,
        avatar: notification.recipient.avatar,
      }),
    };
  }
}
