import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserState } from '../types/user.types';

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  password: z.string().min(6),
  username: z.string().optional().nullable(),
  isPrivate: z.boolean(),
  state: z.enum(UserState),
  firstName: z.string().nullable(),
  lastName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
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

export type User = z.infer<typeof UserSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;

export class UserDto extends createZodDto(UserSchema) {}
export class PublicUserDto extends createZodDto(PublicUserSchema) {}
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
