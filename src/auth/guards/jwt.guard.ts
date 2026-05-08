import {
  ExecutionContext,
  ForbiddenException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import Redis from 'ioredis';

import {
  AUTH_KEY,
  AuthorizeOptions,
  IncludeOrExclude,
} from 'src/user/decorators/authorization.decorator';
import { UserState } from 'src/user/types/user.types';
import { FastifyRequest } from 'fastify';
import { AUTH_REVOKED } from 'src/redis/redis.keys';

const RESTRICTED_STATES = [
  UserState.INIT,
  UserState.INACTIVE,
  UserState.BANNED,
];

export class JwtAuthGuard extends AuthGuard('jwt-access') {
  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    private reflector: Reflector,
  ) {
    super();
  }

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();

    const isAuth = await super.canActivate(ctx);
    if (!isAuth || !req.user) return false;

    const { deviceId, id, state } = req.user;

    const revoked = await this.redis.exists(AUTH_REVOKED(id, deviceId));
    if (revoked) {
      throw new UnauthorizedException('Device revoked');
    }

    const allowed: AuthorizeOptions =
      this.reflector.getAllAndOverride<AuthorizeOptions>(AUTH_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);

    const isIncludedOrExcluded = <T>(
      options: IncludeOrExclude<T>,
      value: T,
    ) => {
      if ('include' in options) {
        return !options.include.includes(value);
      } else if ('exclude' in options) {
        return options.exclude.includes(value);
      }
      return true; // If neither include nor exclude is defined, allow by default
    };

    const mergedAllowed = allowed
      ? allowed.states || { exclude: [] }
      : { exclude: RESTRICTED_STATES };

    if (isIncludedOrExcluded(mergedAllowed, req.user.state)) {
      throw new ForbiddenException('User state restricted');
    }

    return !!state;
  }
}
