import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { SessionsService } from 'src/sessions/sessions.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

import { LogoutDeviceDto } from 'src/auth/dto/auth.dto';
import { InitUserDto } from './dto/user.dto';

import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { States } from './decorators/authorization.decorator';

import { UserState } from './types/user.types';
import { UserEntity } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('devices')
  me(@CurrentUser('id') userId: number) {
    return this.sessionService.getUserDevices(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('devices')
  revokeDevice(
    @CurrentUser('id') userId: number,
    @Body() dto: LogoutDeviceDto,
  ) {
    return this.sessionService.logoutDevice(userId, dto.deviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check-username')
  async checkUsername(
    @CurrentUser() user: UserEntity,
    @Body('username') username: string,
  ) {
    const isTaken = await this.userService.isUsernameTaken(username, user);
    return { isTaken };
  }

  @UseGuards(JwtAuthGuard)
  @States(UserState.INIT)
  @Post('init')
  async init(@CurrentUser('id') id: number, @Body() dto: InitUserDto) {
    await this.userService.initUser(id, dto);
    return { statusCode: 200, message: 'User initialized' };
  }
}
