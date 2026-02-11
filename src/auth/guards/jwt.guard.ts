import {
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import Redis from 'ioredis';

export class JwtAuthGuard extends AuthGuard('jwt-access') {
  constructor(@Inject('REDIS') private readonly redis: Redis) {
    super();
  }

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    await super.canActivate(ctx);

    const { deviceId, userId } = req.user;

    const revoked = await this.redis.exists(
      `auth:device:revoked:${userId}:${deviceId}`,
    );

    if (revoked) {
      throw new UnauthorizedException('Device revoked');
    }

    return true;
  }
}
