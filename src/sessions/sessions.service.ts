import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { SessionsEntity } from 'src/sessions/entities/sessions.entity';
import { LessThan, Repository } from 'typeorm';
import ms, { StringValue } from 'ms';
import { Cron } from '@nestjs/schedule';

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
  ) {}

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
