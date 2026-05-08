import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { States } from 'src/user/decorators/authorization.decorator';
import { RelationshipService } from './relationship.service';
import { FollowDto } from './dto/relationship.dto';

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
  @Get('following/:id')
  @States()
  async getFollowing(@Param('id') id: number) {
    return this.relationshipService.getFollowing(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('followers/:id')
  @States()
  async getFollowers(@Param('id') id: number) {
    return this.relationshipService.getFollowers(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends/:id')
  @States()
  async getFriends(@Param('id') id: number) {
    return this.relationshipService.getFriends(id);
  }
}
