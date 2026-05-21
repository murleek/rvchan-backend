import { Module } from '@nestjs/common';
import { LikeService } from './reaction.service';

@Module({
  providers: [LikeService],
})
export class LikeModule {}
