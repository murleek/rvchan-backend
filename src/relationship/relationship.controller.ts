import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { States } from 'src/user/decorators/authorization.decorator';
import { RelationshipService } from './relationship.service';
import { FollowDto } from './dto/relationship.dto';
import { CursorPaginationDto } from 'src/pagination/dto/cursor-pagination.dto';

@Controller('relationship')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @UseGuards(JwtAuthGuard)
  @Post('follow')
  @States()
  async follow(
    @CurrentUser() user: { id: number; deviceId: string },
    @Body() body: FollowDto,
  ) {
    return this.relationshipService.follow(user.id, body.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unfollow')
  @States()
  async unfollow(
    @CurrentUser() user: { id: number; deviceId: string },
    @Body() body: FollowDto,
  ) {
    return this.relationshipService.unfollow(user.id, body.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('block')
  @States()
  async block(
    @CurrentUser() user: { id: number; deviceId: string },
    @Body() body: FollowDto,
  ) {
    return this.relationshipService.block(user.id, body.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unblock')
  @States()
  async unblock(
    @CurrentUser() user: { id: number; deviceId: string },
    @Body() body: FollowDto,
  ) {
    return this.relationshipService.unblock(user.id, body.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('following/:username')
  @States()
  async getFollowing(
    @Param('username') username: string,
    @Query() dto?: CursorPaginationDto,
  ) {
    return this.relationshipService.getFollowing(username, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('followers/:username')
  @States()
  async getFollowers(
    @Param('username') username: string,
    @Query() dto?: CursorPaginationDto,
  ) {
    return this.relationshipService.getFollowers(username, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends/:username')
  @States()
  async getFriends(
    @Param('username') username: string,
    @Query() dto?: CursorPaginationDto,
  ) {
    return this.relationshipService.getFriends(username, dto);
  }
}
