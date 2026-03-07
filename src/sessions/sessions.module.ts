import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionsService } from './sessions.service';

import { SessionsEntity } from 'src/sessions/entities/sessions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SessionsEntity])],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
