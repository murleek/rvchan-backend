import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const OffsetPaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100)),
});

export type OffsetPaginationInput = z.input<typeof OffsetPaginationSchema>;
export type OffsetPaginationOutput = z.output<typeof OffsetPaginationSchema>;

export class OffsetPaginationDto extends createZodDto(OffsetPaginationSchema) {}
