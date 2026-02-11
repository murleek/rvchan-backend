import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionsService } from './sessions.service';

import { RefreshTokenEntity } from 'src/sessions/entities/refresh-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenEntity])],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
