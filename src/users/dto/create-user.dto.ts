import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
