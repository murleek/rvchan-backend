import { UserEntity } from '../entities/user.entity';

export const UserState = {
  INIT: 'INIT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BANNED: 'BANNED',
} as const;

export type UserState = keyof typeof UserState;

export interface ICurrentUser extends UserEntity {
  deviceId: string;
}
