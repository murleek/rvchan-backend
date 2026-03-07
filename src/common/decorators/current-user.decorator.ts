import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ICurrentUser } from '../../user/types/user.types';
import { FastifyRequest } from 'fastify';

export const CurrentUser = createParamDecorator(
  (data: keyof ICurrentUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
