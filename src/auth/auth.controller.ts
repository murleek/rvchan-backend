import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RefreshAuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/users/dto/user.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    const user = this.authService.register(dto.email, dto.password);
    return user;
  }

  @Post('login')
  async login(@Req() req: Request, @Body() dto: AuthDto) {
    const auth = await this.authService.login(
      dto.email,
      dto.password,
      ((req.headers['x-forwarded-for'] as string) ||
        req.ip ||
        'unknown') as string,
      req.headers['user-agent'],
    );
    console.log(auth);
    return auth;
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Body() dto: RefreshAuthDto) {
    return this.authService.refresh(
      dto.refreshToken,
      ((req.headers['x-forwarded-for'] as string) ||
        req.ip ||
        'unknown') as string,
      req.headers['user-agent'],
    );
  }

  @UseGuards(AuthGuard('jwt-access'))
  @Get('devices')
  me(@Req() req) {
    return this.authService.getUserDevices(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt-access'))
  @Post('logout')
  logout(@Req() req) {
    return this.authService.logout(req.user.userId);
  }
}
