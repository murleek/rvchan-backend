import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Module } from '@nestjs/common';

import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NotFoundExceptionFilter } from './common/filters/404.filter';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './redis/redis.module';
import { DatabaseModule } from './db/database.module';
import { SessionsModule } from './sessions/sessions.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { UserAgentInterceptor } from './common/interceptors/user-agent.interceptor';
import { IpInterceptor } from './common/interceptors/ip.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    RedisModule,
    DatabaseModule,
    SessionsModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UserAgentInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IpInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
    },
  ],
})
export class AppModule {}
