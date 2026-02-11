import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { RefreshTokenEntity } from '../sessions/entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import ms from 'ms';
import { SessionsService } from 'src/sessions/sessions.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshTokenEntity)
    private refreshRepo: Repository<RefreshTokenEntity>,
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
    userAgent: string,
    session?: RefreshTokenEntity,
  ) {
    const deviceId = session?.deviceId ?? crypto.randomUUID();

    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      deviceId,
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    let newSession = session ?? ({} as RefreshTokenEntity);

    newSession.user = user;
    newSession.deviceId = deviceId;
    newSession.ip = ip;
    newSession.userAgent = userAgent;
    newSession.tokenHash = tokenHash;
    newSession.expiresAt = new Date(
      ms(SessionsService.refreshTtl) + Date.now(),
    );

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
    ua: string = 'unknown',
  ) {
    const user = await this.userService.validate(email, password);

    return this.issueTokens(user, ip, ua);
  }

  async refresh(refreshToken: string, ip: string, ua: string = 'unknown') {
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

    return this.issueTokens(session.user, ip, ua, session);
  }

  async logout(deviceId: string) {
    await this.refreshRepo.delete({ deviceId });
    return { statusCode: 200 };
  }
}
