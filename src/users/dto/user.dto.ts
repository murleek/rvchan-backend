import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserEntity } from '../entities/user.entity';

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  password: z.string().min(6),
}) satisfies z.ZodType<UserEntity>;

export type User = z.infer<typeof UserSchema>;
export class UserDto extends createZodDto(UserSchema) {}
