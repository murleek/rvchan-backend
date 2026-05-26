import { forwardRef, Module } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBlocksEntity } from './entities/user-blocks.entity';
import { UserFollowsEntity } from './entities/user-follows.entity';
import { UserModule } from 'src/user/user.module';
import { PaginationModule } from 'src/pagination/pagination.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFollowsEntity, UserBlocksEntity]),
    forwardRef(() => UserModule),
    PaginationModule,
  ],
  providers: [RelationshipService],
  controllers: [RelationshipController],
  exports: [RelationshipService],
})
export class RelationshipModule {}
