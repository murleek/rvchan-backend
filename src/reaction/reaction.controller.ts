import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserState, type ICurrentUser } from 'src/user/types/user.types';
import { ReactionService } from './reaction.service';
import { States } from 'src/user/decorators/authorization.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('reaction')
export class ReactionController {
  constructor(private reactionService: ReactionService) {}

  @Post(':postId')
  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  async react(
    @Param('postId') postId: number,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.reactionService.setReaction(postId, user.id, 'like');
  }
}
