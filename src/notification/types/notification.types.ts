export const NotificationType = {
  FOLLOW: 'follow',
  FOLLOW_ACCEPTED: 'follow_accepted',
  NEW_DEVICE: 'new_device',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
