import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { States } from 'src/user/decorators/authorization.decorator';
import { NotificationService } from './notification.service';
import { type ICurrentUser, UserState } from 'src/user/types/user.types';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  async getNotifications(@CurrentUser() user: ICurrentUser) {
    const notifications = await this.notificationService.getNotifications(user);
    const unseen = await this.notificationService.countUnseenNotifications(
      user.id,
      user.deviceId,
    );

    return { notifications, unseen };
  }
}
