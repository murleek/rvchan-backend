import { Module } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBlocksEntity } from './entities/user-blocks.entity';
import { UserFollowsEntity } from './entities/user-follows.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFollowsEntity]),
    TypeOrmModule.forFeature([UserBlocksEntity]),
  ],
  providers: [RelationshipService],
  controllers: [RelationshipController],
  exports: [RelationshipService],
})
export class RelationshipModule {}
