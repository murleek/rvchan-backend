import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ShortPublicUserSchema } from 'src/user/dto/user.dto';

export const TextEntitySchema = z.object({
  from: z.number(),
  to: z.number(),
});

export const MentionEntitySchema = TextEntitySchema.extend({
  type: z.literal('mention'),
  username: z.string(),
});

export const LinkEntitySchema = TextEntitySchema.extend({
  type: z.literal('link'),
  url: z.string(),
});

export type TextEntity = z.infer<typeof TextEntitySchema>;
export type MentionEntity = z.infer<typeof MentionEntitySchema>;
export type LinkEntity = z.infer<typeof LinkEntitySchema>;

const CursorPaginationSchema = (el: z.ZodTypeAny) =>
  z.object({
    data: z.array(el),
    meta: z.object({
      nextCursor: z.string().nullable(),
      prevCursor: z.string().nullable(),
      hasNextPage: z.boolean(),
      hasPrevPage: z.boolean(),
      limit: z.number().int().positive(),
    }),
  });

export const PostSchema = z.object({
  id: z.number().int().positive(),
  user: ShortPublicUserSchema,
  content: z.string(),
  replyCount: z.number(),
  likeCount: z.number(),
  createdAt: z.date(),
  isLiked: z.boolean(),
  entities: z
    .array(z.union([MentionEntitySchema, LinkEntitySchema]))
    .nullable(),
});

export const ThreadSchema = PostSchema.extend({
  parents: z.array(PostSchema).optional(),
  replies: CursorPaginationSchema(PostSchema).optional(),
});

export type PublicPost = z.infer<typeof PostSchema>;
export type PublicThread = z.infer<typeof ThreadSchema>;

export class PostDto extends createZodDto(PostSchema) {}
