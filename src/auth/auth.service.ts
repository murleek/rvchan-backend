import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { ParsedUserAgent } from 'src/common/interfaces/user-agent.interface';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly sessionsService: SessionsService,
  ) {}

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

    const { deviceId, ...tokens } = await this.sessionsService.issueTokens(
      user,
      ip,
      userAgent,
    );

    await this.notificationService.newDevice(
      user.id.toString(),
      { ...userAgent, deviceId },
      ip,
    );

    return tokens;
  }

  async refresh(refreshToken: string, ip: string, userAgent: ParsedUserAgent) {
    let payload: any;

    try {
      payload = await this.sessionsService.verify(refreshToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sessionsService.getSession(payload.deviceId);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const match = await this.sessionsService.validateHashes(
      refreshToken,
      session,
    );

    if (!match) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.sessionsService.issueTokens(
      session.user,
      ip,
      userAgent,
      session,
    );
  }

  async logout(deviceId: string) {
    await this.sessionsService.deleteSession(deviceId);
    return { statusCode: 200 };
  }
}
