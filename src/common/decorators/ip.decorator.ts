import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ParsedUserAgent } from '../interfaces/user-agent.interface';

export const Ip = createParamDecorator(
  (_, ctx: ExecutionContext): ParsedUserAgent =>
    ctx.switchToHttp().getRequest().clientIp,
);
