import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { UserEntity } from 'src/users/entities/user.entity';
import ms from 'ms';

@Injectable()
export class AuthService {
  private readonly refreshTtl =
    (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || '7d';
  private readonly accessTtl =
    (process.env.JWT_EXPIRES_IN as StringValue) || '15m';

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
          expiresAt: new Date(ms(this.refreshTtl) + Date.now()),
        } as RefreshTokenEntity);

    newSession.ip = ip;
    newSession.userAgent = userAgent;
    newSession.tokenHash = tokenHash;

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
    const payload = await this.jwtService.verifyAsync(refreshToken);

    const sessions = await this.refreshRepo.find({
      where: { user: { id: payload.sub } },
      relations: ['user'],
    });

    const session = await this.findValidSession(sessions, refreshToken);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    session.ip = ip;
    session.userAgent = ua;

    await this.refreshRepo.save(session);
    console.log('Revoked session:', session.id);

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
}
