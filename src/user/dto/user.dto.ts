import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserState } from '../types/user.types';

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  password: z.string().min(6),
  username: z.string().min(5).max(32).optional().nullable(),
  isPrivate: z.boolean(),
  state: z.enum(UserState),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const InitUserSchema = z.object({
  username: z.string().min(5).max(32),
  firstName: z.string(),
  lastName: z.string().optional(),
  description: z.string().optional(),
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
