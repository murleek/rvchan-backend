import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { ParsedUserAgent } from 'src/common/interfaces/user-agent.interface';
import { JwtAccessPayload } from './types/jwt.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResendService } from 'src/resend/resend.service';
import { OTP_CODE_KEY } from 'src/redis/redis.keys';
import { RedisService } from 'src/redis/redis.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly otpTTL = parseInt(process.env.AUTH_OTP_TTL!) || 300;
  private readonly otpLength = 6;

  constructor(
    private readonly userService: UserService,
    private readonly sessionsService: SessionsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly resendService: ResendService,
    private readonly redisService: RedisService,
  ) {}

  async register(email: string, password: string, code: string) {
    const isCodeValid = await this.isCodeValid(email, code);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid OTP code');
    }
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

    // await this.notificationService.newDevice(
    //   user.id,
    //   { ...userAgent, deviceId },
    //   ip,
    // );

    this.eventEmitter.emit('session.new_device', {
      userId: user.id,
      device: userAgent,
      deviceId,
      ip,
    });

    return tokens;
  }

  async refresh(refreshToken: string, ip: string, userAgent: ParsedUserAgent) {
    let payload: JwtAccessPayload;

    try {
      payload = await this.sessionsService.verify(refreshToken);
    } catch {
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

  generateOtpCode() {
    let code = '';
    for (let i = 0; i < this.otpLength; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  async isCodeValid(email: string, providedCode: string) {
    const codeKey = OTP_CODE_KEY(email);
    const rawPayload = await this.redisService.get(codeKey);

    const stored: {
      code: string;
      email: string;
      password: string;
      expires: number;
    } | null = rawPayload ? JSON.parse(rawPayload) : null;

    if (stored) {
      const { code, ...payload } = stored;
      if (code === providedCode && Date.now() < stored.expires) {
        await this.redisService.del(codeKey);
        return [true, payload] as const;
      }
    }
    return [false, null] as const;
  }

  async sendOtpCode(email: string, password: string) {
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('user_exists');
    }

    const code = this.generateOtpCode();
    const codeKey = OTP_CODE_KEY(email);

    const hash = await bcrypt.hash(password, 10);

    await this.redisService.setex(
      codeKey,
      1800,
      JSON.stringify({
        code: code,
        expires: Date.now() + this.otpTTL * 1000,
        email,
        password: hash,
      }),
    );

    await this.resendService.sendOtpEmail(email, code);

    return { ok: true, codeLength: this.otpLength, ttl: 120000 };
  }

  async verifyAndRegister(email: string, code: string) {
    const [isCodeValid, credentials] = await this.isCodeValid(email, code);
    if (!isCodeValid || !credentials) {
      throw new UnauthorizedException('otp-invalid');
    }

    return this.userService.create(email, credentials.password);
  }
}
