import { MultipartFile } from '@fastify/multipart';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ProvidedFile = createParamDecorator(
  (_, ctx: ExecutionContext): MultipartFile =>
    ctx.switchToHttp().getRequest().incomingFile,
);
