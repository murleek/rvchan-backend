import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const CursorObject = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        Buffer.from(val, 'base64url').toString('utf8');
        return true;
      } catch {
        return false;
      }
    },
    { message: 'cursor must be a valid base64url string' },
  );

export const CursorPaginationSchema = z.object({
  before: CursorObject,
  after: CursorObject,
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100)),
});

export type CursorPaginationInput = z.input<typeof CursorPaginationSchema>;
export type CursorPaginationOutput = z.output<typeof CursorPaginationSchema>;

export type CursorPagination = z.infer<typeof CursorPaginationSchema>;

export class CursorPaginationDto extends createZodDto(CursorPaginationSchema) {}
