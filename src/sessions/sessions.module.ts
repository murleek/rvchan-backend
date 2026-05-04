import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionsService } from './sessions.service';

import { SessionsEntity } from 'src/sessions/entities/sessions.entity';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionsEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN as StringValue | number) ?? '1d',
      },
    }),
  ],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
