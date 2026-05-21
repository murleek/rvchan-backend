import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserState, type ICurrentUser } from 'src/user/types/user.types';
import { States } from 'src/user/decorators/authorization.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CursorPaginationDto } from 'src/pagination/dto/cursor-pagination.dto';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  async create(
    @Body() data: { content: string; parentId?: number },
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.postService.createPost(data, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  async delete(@Param('id') id: number, @CurrentUser() user: ICurrentUser) {
    return this.postService.deletePost(id, user);
  }

  @Delete('cancel/:jobId')
  @UseGuards(JwtAuthGuard)
  @States(UserState.ACTIVE)
  async cancel(
    @Param('jobId') jobId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.postService.cancelPost(jobId, user);
  }

  // @Get(':id/thread')
  // async getThread(@Param('id') id: number) {
  //   return this.postService.getThread(id);
  // }

  // @Get(':id/replies')
  // async getReplies(@Param('id') id: number) {
  //   return this.postService.getReplies(id);
  // }

  @Get(':username/threads')
  async getUserThreads(
    @Param('username') username: string,
    @Query() dto: CursorPaginationDto,
  ) {
    return this.postService.getUserThreads(username, dto);
  }

  @Get(':username/threads/:threadId')
  async getThread(
    @Param('username') username: string,
    @Param('threadId') threadId: number,
  ) {
    return this.postService.getThread(threadId, username);
  }
}
