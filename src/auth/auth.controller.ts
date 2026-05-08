import { Controller, Post, Body, Req, UseGuards, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RefreshAuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/user/dto/user.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { States } from 'src/user/decorators/authorization.decorator';
import { type FastifyRequest } from 'fastify';
import { UserAgent } from 'src/common/decorators/user-agent.decorator';
import type { ParsedUserAgent } from 'src/common/interfaces/user-agent.interface';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({
    default: { ttl: 60000, limit: 2 },
  })
  @Post('register')
  @States()
  register(@Body() dto: CreateUserDto) {
    const user = this.authService.register(dto.email, dto.password);
    return user;
  }

  @Throttle({
    default: { ttl: 60000, limit: 5 },
  })
  @Post('login')
  @States()
  async login(
    @UserAgent() userAgent: ParsedUserAgent,
    @Body() dto: AuthDto,
    @Ip() ip: string,
  ) {
    const auth = await this.authService.login(
      dto.email,
      dto.password,
      ip,
      userAgent,
    );
    return auth;
  }

  @Throttle({
    default: { ttl: 60000, limit: 5 },
  })
  @Post('refresh')
  @States()
  refresh(
    @UserAgent() userAgent: ParsedUserAgent,
    @Body() dto: RefreshAuthDto,
    @Ip() ip: string,
  ) {
    return this.authService.refresh(dto.refreshToken, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @States()
  logout(@CurrentUser('deviceId') deviceId: string) {
    return this.authService.logout(deviceId);
  }
}
