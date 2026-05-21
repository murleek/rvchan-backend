import { Body, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { States } from 'src/user/decorators/authorization.decorator';
import { NotificationService } from './notification.service';
import { type ICurrentUser, UserState } from 'src/user/types/user.types';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CursorPaginationDto } from 'src/pagination/dto/cursor-pagination.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  async getNotifications(
    @CurrentUser() user: ICurrentUser,
    @Query() dto: CursorPaginationDto,
  ) {
    const notifications = await this.notificationService.getNotifications(
      user,
      dto,
    );
    const unseen = await this.notificationService.countUnseenNotifications(
      user.id,
      user.deviceId,
    );

    return { notifications, unseen };
  }
}
