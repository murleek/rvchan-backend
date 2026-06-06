import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const MediaSchema = z.object({
  id: z.uuid(),
  url: z.url(),
});

export type Media = z.infer<typeof MediaSchema>;
export class MediaDto extends createZodDto(MediaSchema) {}

export const CreateMediaSchema = MediaSchema;
export type CreateMedia = z.infer<typeof CreateMediaSchema>;

export const CreateMediaResponseSchema = MediaSchema.extend({
  url: z.url(),
});
export class CreateMediaResponseDto extends createZodDto(
  CreateMediaResponseSchema,
) {}
