import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SessionsModule } from 'src/sessions/sessions.module';
import { RelationshipModule } from 'src/relationship/relationship.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    SessionsModule,
    RelationshipModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
