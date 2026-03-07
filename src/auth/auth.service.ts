import {
  ImATeapotException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { SessionsEntity } from '../sessions/entities/sessions.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import ms from 'ms';
import { SessionsService } from 'src/sessions/sessions.service';
import { UserState } from 'src/user/types/user.types';
import { ParsedUserAgent } from 'src/common/interfaces/user-agent.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(SessionsEntity)
    private refreshRepo: Repository<SessionsEntity>,
  ) {}

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

    await this.refreshRepo.save(newSession);

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(email: string, password: string) {
    return this.userService.create(email, password);
  }

  async login(
    email: string,
    password: string,
    ip: string,
    userAgent: ParsedUserAgent,
  ) {
    const user = await this.userService.validate(email, password);

    return this.issueTokens(user, ip, userAgent);
  }

  async refresh(refreshToken: string, ip: string, userAgent: ParsedUserAgent) {
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.refreshRepo.findOne({
      where: {
        user: { id: payload.sub },
        deviceId: payload.deviceId,
      },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const match = await bcrypt.compare(refreshToken, session.tokenHash);

    if (!match) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(session.user, ip, userAgent, session);
  }

  async logout(deviceId: string) {
    await this.refreshRepo.delete({ deviceId });
    return { statusCode: 200 };
  }
}
