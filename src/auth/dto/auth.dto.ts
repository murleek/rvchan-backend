import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AuthSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type AuthRequest = z.infer<typeof AuthSchema>;
export class AuthDto extends createZodDto(AuthSchema) {}
