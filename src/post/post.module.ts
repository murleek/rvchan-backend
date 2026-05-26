import { forwardRef, Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostingProcessor } from './queue/post.queue';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { UserModule } from 'src/user/user.module';
import { ReactionModule } from 'src/reaction/reaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    BullModule.registerQueue({
      name: 'posting',
    }),
    WebsocketModule,
    PaginationModule,
    UserModule,
    forwardRef(() => ReactionModule),
  ],
  providers: [PostService, PostingProcessor],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
