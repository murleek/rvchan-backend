import { Body, Controller, Delete, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { LogoutDeviceDto } from 'src/auth/dto/auth.dto';
import { SessionsService } from 'src/sessions/sessions.service';

@Controller('user')
export class UserController {
  constructor(private readonly sessionService: SessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('devices')
  me(@Req() req) {
    return this.sessionService.getUserDevices(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('devices')
  revokeDevice(@Req() req, @Body() dto: LogoutDeviceDto) {
    return this.sessionService.logoutDevice(req.user.userId, dto.deviceId);
  }
}
