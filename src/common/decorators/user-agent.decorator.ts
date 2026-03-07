import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ParsedUserAgent } from '../interfaces/user-agent.interface';

export const UserAgent = createParamDecorator(
  (_, ctx: ExecutionContext): ParsedUserAgent =>
    ctx.switchToHttp().getRequest().userAgent,
);
