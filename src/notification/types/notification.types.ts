import { ParsedUserAgent } from 'src/common/interfaces/user-agent.interface';

export const NotificationType = {
  FOLLOW: 'follow',
  FOLLOW_ACCEPTED: 'follow_accepted',
  NEW_DEVICE: 'new_device',
  POST_MENTION: 'post_mention',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export type NotificationFollow = {
  type: typeof NotificationType.FOLLOW;
  recipientId: number;
  actorId: number;
  payload?: undefined;
};
export type NotificationFollowAccepted = {
  type: typeof NotificationType.FOLLOW_ACCEPTED;
  recipientId: number;
  actorId: number;
  payload?: undefined;
};
export type NotificationNewDevice = {
  type: typeof NotificationType.NEW_DEVICE;
  recipientId: number;
  payload: { device: ParsedUserAgent; ip: string };
  actorId?: undefined;
};
export type NotificationPostMention = {
  type: typeof NotificationType.POST_MENTION;
  recipientId: number;
  actorId: number;
  payload: { postId: number; username: string };
};

export type Notification =
  | NotificationFollow
  | NotificationFollowAccepted
  | NotificationNewDevice
  | NotificationPostMention;
