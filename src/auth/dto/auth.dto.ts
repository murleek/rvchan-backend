import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AuthSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const RefreshAuthSchema = z.object({
  refreshToken: z.string(),
});

export const LogoutDeviceSchema = z.object({
  deviceId: z.uuid(),
});

export type AuthRequest = z.infer<typeof AuthSchema>;
export type RefreshAuthRequest = z.infer<typeof RefreshAuthSchema>;
export type LogoutDeviceRequest = z.infer<typeof LogoutDeviceSchema>;

export class AuthDto extends createZodDto(AuthSchema) {}
export class RefreshAuthDto extends createZodDto(RefreshAuthSchema) {}
export class LogoutDeviceDto extends createZodDto(LogoutDeviceSchema) {}
