import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const FollowSchema = z.object({
  id: z.number(),
});

export type Follow = z.infer<typeof FollowSchema>;

export class FollowDto extends createZodDto(FollowSchema) {}
