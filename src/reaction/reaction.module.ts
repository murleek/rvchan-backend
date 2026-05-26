import { forwardRef, Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { ReactionController } from './reaction.controller';
import { PostModule } from 'src/post/post.module';
import { ReactionEntity } from './entities/reaction.entity';
import { PostEntity } from 'src/post/entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [ReactionService],
  controllers: [ReactionController],
  imports: [
    TypeOrmModule.forFeature([ReactionEntity, PostEntity]),
    forwardRef(() => PostModule),
  ],
  exports: [ReactionService],
})
export class ReactionModule {}
