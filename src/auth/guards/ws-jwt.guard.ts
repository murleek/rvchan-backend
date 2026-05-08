import {
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import Redis from 'ioredis';
import { AUTH_REVOKED } from 'src/redis/redis.keys';

import {
  AUTH_KEY,
  AuthorizeOptions,
  IncludeOrExclude,
} from 'src/user/decorators/authorization.decorator';
import { ICurrentUser, UserState } from 'src/user/types/user.types';

const RESTRICTED_STATES = [
  UserState.INIT,
  UserState.INACTIVE,
  UserState.BANNED,
];

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt-access') {
  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    private reflector: Reflector,
  ) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient();

    return {
      headers: {
        authorization: `Bearer ${client.handshake?.auth?.token}`,
      },
    };
  }

  async canActivate(ctx: ExecutionContext) {
    const client = ctx.switchToWs().getClient();

    const isAuth = await super.canActivate(ctx);
    if (!isAuth || !client.data.user) {
      throw new UnauthorizedException();
    }

    const user = client.data.user as ICurrentUser;

    const { deviceId, id, state } = user;

    // 🔐 проверка revoked устройства
    const revoked = await this.redis.exists(AUTH_REVOKED(id, deviceId));

    if (revoked) {
      throw new UnauthorizedException('Device revoked');
    }

    // 🧠 authorization decorator
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
      return true;
    };

    const mergedAllowed = allowed
      ? allowed.states || { exclude: [] }
      : { exclude: RESTRICTED_STATES };

    if (isIncludedOrExcluded(mergedAllowed, state)) {
      throw new ForbiddenException('User state restricted');
    }

    return true;
  }
}
