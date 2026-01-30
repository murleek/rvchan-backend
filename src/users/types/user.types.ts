export const UserState = {
  INIT: 'init',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',
} as const;

export type UserState = keyof typeof UserState;
