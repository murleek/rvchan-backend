import { Module } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBlocksEntity } from './entities/user-blocks.entity';
import { UserFollowsEntity } from './entities/user-follows.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFollowsEntity]),
    TypeOrmModule.forFeature([UserBlocksEntity]),
    NotificationModule,
  ],
  providers: [RelationshipService],
  controllers: [RelationshipController],
  exports: [RelationshipService],
})
export class RelationshipModule {}
