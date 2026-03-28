import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { SessionsService } from 'src/sessions/sessions.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

import { LogoutDeviceDto } from 'src/auth/dto/auth.dto';
import {
  EditProfileDto,
  GetUserDto,
  InitUserDto,
  SearchUsersDto,
} from './dto/user.dto';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
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
  @Get('profile')
  @States()
  async getMe(@CurrentUser() user: { id: number; deviceId: string }) {
    return this.userService.getUser(user.id);
  }
  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  @Patch('profile')
  async editProfile(
    @CurrentUser('id') id: number,
    @Body() dto: EditProfileDto,
  ) {
    return this.userService.editProfile(id, dto);
  }
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
  @Post('check-username')
  @States(UserState.INIT, UserState.ACTIVE)
  async checkUsername(
    @Body('username') username: string,
    @CurrentUser() user: UserEntity,
  ) {
    const available = await this.userService.isUsernameAvailable(
      username,
      user,
    );
    return available;
  }

  @UseGuards(JwtAuthGuard)
  @States(UserState.INIT)
  @Post('init')
  async init(@CurrentUser('id') id: number, @Body() dto: InitUserDto) {
    await this.userService.initUser(id, dto);
    return { statusCode: 200, message: 'User initialized' };
  }

  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  @Get('get-user')
  async getUser(@CurrentUser() user: UserEntity, @Query() dto: GetUserDto) {
    const foundUser = await this.userService.getUserProfile(user, dto.username);
    return foundUser;
  }

  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  @Get('search')
  async search(@Query() dto: SearchUsersDto) {
    return this.userService.searchUsers(dto.q);
  }
}
