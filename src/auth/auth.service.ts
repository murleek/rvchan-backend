import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { UserEntity } from 'src/users/entities/user.entity';
import ms from 'ms';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  private readonly refreshTtl =
    (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || '7d';
  private readonly accessTtl =
    (process.env.JWT_EXPIRES_IN as StringValue) || '15m';
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshTokenEntity)
    private refreshRepo: Repository<RefreshTokenEntity>,
  ) {}

  private async findValidSession(
    sessions: RefreshTokenEntity[],
    refreshToken: string,
  ) {
    for (const session of sessions) {
      const match = await bcrypt.compare(refreshToken, session.tokenHash);

      if (match) return session;
    }

    return null;
  }

  private async generateTokens(user: UserEntity) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: this.accessTtl }),
      this.jwtService.signAsync(payload, { expiresIn: this.refreshTtl }),
    ]);

    return { accessToken, refreshToken };
  }

  async issueTokens(
    user: UserEntity,
    ip: string,
    userAgent: string,
    session?: RefreshTokenEntity,
  ) {
    const { accessToken, refreshToken } = await this.generateTokens(user);

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    let newSession: RefreshTokenEntity = session
      ? session
      : ({
          user,
        } as RefreshTokenEntity);

    newSession.ip = ip;
    newSession.userAgent = userAgent;
    newSession.tokenHash = tokenHash;
    newSession.expiresAt = new Date(ms(this.refreshTtl) + Date.now());

    await this.refreshRepo.save(newSession);

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(email: string, password: string) {
    return this.usersService.create(email, password);
  }

  async login(
    email: string,
    password: string,
    ip: string,
    ua: string = 'unknown',
  ) {
    const user = await this.usersService.validate(email, password);

    return this.issueTokens(user, ip, ua);
  }

  async refresh(refreshToken: string, ip: string, ua: string = 'unknown') {
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const sessions = await this.refreshRepo.find({
      where: { user: { id: payload.sub } },
      relations: ['user'],
    });

    const session = await this.findValidSession(sessions, refreshToken);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(session.user, ip, ua, session);
  }

  async logout(userId: number) {
    await this.refreshRepo.delete({ user: { id: userId } });
    return { statusCode: 200 };
  }

  async getUserDevices(userId: number) {
    const sessions = await this.refreshRepo.find({
      where: { user: { id: userId } },
    });

    return sessions.map((session) => ({
      id: session.id,
      ip: session.ip,
      userAgent: session.userAgent,
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
