import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';

import { LessThan, Repository } from 'typeorm';
import ms, { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

import { SessionsEntity } from 'src/sessions/entities/sessions.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { ParsedUserAgent } from 'src/common/interfaces/user-agent.interface';
import { UserState } from 'src/user/types/user.types';

@Injectable()
export class SessionsService {
  public static readonly refreshTtl =
    (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || '7d';
  public static readonly accessTtl =
    (process.env.JWT_EXPIRES_IN as StringValue) || '15m';
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(SessionsEntity)
    private refreshRepo: Repository<SessionsEntity>,
    @Inject('REDIS') private readonly redis: Redis,

    private readonly jwtService: JwtService,
  ) {}

  async verify(token: string) {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async logoutDevice(userId: number, deviceId: string) {
    await this.redis.set(
      `auth:device:revoked:${userId}:${deviceId}`,
      '1',
      'EX',
      ms(SessionsService.accessTtl) / 1000,
    );

    return await this.refreshRepo.delete({ deviceId });
  }

  async getUserDevices(userId: number) {
    const sessions = await this.refreshRepo.find({
      where: { user: { id: userId } },
      order: { updatedAt: 'DESC' },
    });

    return sessions.map((session) => ({
      id: session.deviceId,
      ip: session.ip.split(',')[0].trim(),
      userAgent: {
        raw: session.userAgent,
        browser: session.browser,
        browserVersion: session.browserVersion,
        deviceModel: session.deviceModel,
        deviceType: session.deviceType,
        deviceVendor: session.deviceVendor,
        os: session.os,
        osVersion: session.osVersion,
      },
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    }));
  }

  async getSession(deviceId: string) {
    return await this.refreshRepo.findOne({
      where: { deviceId },
      relations: ['user'],
    });
  }

  async deleteSession(deviceId: string) {
    await this.redis.set(
      `auth:device:revoked:${deviceId}`,
      '1',
      'EX',
      ms(SessionsService.accessTtl) / 1000,
    );

    return await this.refreshRepo.delete({ deviceId });
  }

  private async generateTokens(user: UserEntity, deviceId: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      deviceId: deviceId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: SessionsService.accessTtl,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: SessionsService.refreshTtl,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async issueTokens(
    user: UserEntity,
    ip: string,
    userAgent: ParsedUserAgent,
    session?: SessionsEntity,
  ) {
    const deviceId = session?.deviceId ?? crypto.randomUUID();

    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      deviceId,
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    let newSession = session ?? ({} as SessionsEntity);

    if (user.state === UserState.INIT) {
      await this.refreshRepo.delete({ user: { id: user.id } });
    }

    newSession = {
      ...newSession,
      user,
      deviceId,
      ip,
      userAgent: userAgent.raw,
      browser: userAgent.browser || 'unknown',
      browserVersion: userAgent.browserVersion || 'unknown',
      deviceModel: userAgent.deviceModel || 'unknown',
      deviceType: userAgent.deviceType || 'unknown',
      deviceVendor: userAgent.deviceVendor || 'unknown',
      os: userAgent.os || 'unknown',
      osVersion: userAgent.osVersion || 'unknown',

      tokenHash,
      expiresAt: new Date(ms(SessionsService.refreshTtl) + Date.now()),
    } as SessionsEntity;

    const savedSession = await this.refreshRepo.save(newSession);

    return {
      deviceId: savedSession.deviceId,
      accessToken,
      refreshToken,
    };
  }

  async validateHashes(token: string, session: SessionsEntity) {
    return await bcrypt.compare(token, session.tokenHash);
  }

  @Cron('0 5 * * 6') // every saturday at 5:00 AM
  async cleanupExpiredSessions() {
    const now = new Date();
    this.logger.debug('Cleaning up expired refresh tokens...');
    const sessions = await this.refreshRepo.delete({
      expiresAt: LessThan(now),
    });

    if (!sessions.affected) {
      this.logger.debug('No expired sessions found.');
    } else {
      this.logger.debug(`Deleted ${sessions.affected} expired sessions.`);
    }
  }
}
