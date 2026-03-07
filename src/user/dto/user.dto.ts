import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserState } from '../types/user.types';

const UsernameObject = z.string().min(3).max(32);

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  password: z.string().min(6).max(32),
  username: UsernameObject.optional().nullable(),
  isPrivate: z.boolean(),
  state: z.enum(UserState),
  firstName: z.string().max(32).optional().nullable(),
  lastName: z.string().max(32).optional().nullable(),
  description: z.string().max(256).optional().nullable(),
});

export const InitUserSchema = z.object({
  username: UsernameObject.optional(),
  firstName: z.string().max(32),
  lastName: z.string().max(32).optional(),
  description: z.string().max(256).optional(),
});

export const PublicUserSchema = UserSchema.omit({
  password: true,
});

export const CreateUserSchema = UserSchema.pick({
  email: true,
  password: true,
  username: true,
});

export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  email: true,
  password: true,
});

export const UsernameSchema = InitUserSchema.pick({ username: true });
export const GetUserSchema = z.object({
  username: UsernameObject,
});

export type User = z.infer<typeof UserSchema>;
export type InitUserRequest = z.infer<typeof InitUserSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type UsernameRequest = z.infer<typeof UsernameSchema>;

export class UserDto extends createZodDto(UserSchema) {}
export class InitUserDto extends createZodDto(InitUserSchema) {}
export class PublicUserDto extends createZodDto(PublicUserSchema) {}
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export class UsernameDto extends createZodDto(UsernameSchema) {}
export class GetUserDto extends createZodDto(GetUserSchema) {}
