import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RefreshAuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/user/dto/user.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserService } from 'src/user/user.service';
import { States } from 'src/user/decorators/authorization.decorator';
import { type FastifyRequest } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @States()
  register(@Body() dto: CreateUserDto) {
    const user = this.authService.register(dto.email, dto.password);
    return user;
  }

  @Post('login')
  @States()
  async login(@Req() req: FastifyRequest, @Body() dto: AuthDto) {
    const auth = await this.authService.login(
      dto.email,
      dto.password,
      ((req.headers['x-forwarded-for'] as string) ||
        req.ip ||
        'unknown') as string,
      req.headers['user-agent'],
    );
    return auth;
  }

  @Post('refresh')
  @States()
  refresh(@Req() req: FastifyRequest, @Body() dto: RefreshAuthDto) {
    return this.authService.refresh(
      dto.refreshToken,
      ((req.headers['x-forwarded-for'] as string) ||
        req.ip ||
        'unknown') as string,
      req.headers['user-agent'],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @States()
  logout(@CurrentUser('deviceId') deviceId) {
    return this.authService.logout(deviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @States()
  async getMe(@CurrentUser() user: { id: number; deviceId: string }) {
    return this.userService.getUser(user.id);
  }
}
