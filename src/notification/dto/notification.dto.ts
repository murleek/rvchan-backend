import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { NotificationType } from '../types/notification.types';
import { ShortPublicUserSchema } from 'src/user/dto/user.dto';

export const NotificationSchema = z.object({
  id: z.uuid(),
  type: z.enum(NotificationType),
  isRead: z.boolean(),
  count: z.number(),
  groupKey: z.string().max(100).nullable(),
  createdAt: z.date(),
  actor: ShortPublicUserSchema.optional(),
  payload: z.record(z.string(), z.any()).optional(),
  recipient: ShortPublicUserSchema,
});

export type Notification = z.infer<typeof NotificationSchema>;

export class NotificationDto extends createZodDto(NotificationSchema) {}
