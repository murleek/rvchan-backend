export const ONLINE_KEY = (userId: number | string) => `online:user:${userId}`;
export const AUTH_REVOKED = (userId: number | string, deviceId: string) =>
  `auth:device:revoked:${userId}:${deviceId}`;
