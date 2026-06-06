import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';

import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { SessionsEntity } from '../sessions/entities/sessions.entity';

import { UserEntity } from 'src/user/entities/user.entity';
import { SessionsModule } from 'src/sessions/sessions.module';
import { ResendModule } from 'src/resend/resend.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionsEntity, UserEntity]),
    UserModule,
    PassportModule,
    SessionsModule,
    ResendModule,
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
