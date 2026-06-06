import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
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
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerGuard } from './common/guards/throttler.guard';
import { RelationshipModule } from './relationship/relationship.module';
import { MediaModule } from './media/media.module';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { WebsocketModule } from './websocket/websocket.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PostModule } from './post/post.module';
import { ReactionModule } from './reaction/reaction.module';
import { PaginationModule } from './pagination/pagination.module';
import { ResendModule } from './resend/resend.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 3,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 20,
        },
        {
          name: 'long',
          ttl: 60000,
          limit: 100,
        },
      ],
      storage: new ThrottlerStorageRedisService({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      }),
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    CacheModule.register({
      ttl: 300,
      max: 1000,
      useFactory: () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis(
              `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || '127.0.0.1'}:${Number(process.env.REDIS_PORT) || 6379}`,
            ),
          ],
        };
      },
      // url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || '127.0.0.1'}:${Number(process.env.REDIS_PORT) || 6379}`,
    }),
    EventEmitterModule.forRoot(),

    RedisModule,
    DatabaseModule,
    SessionsModule,
    UserModule,
    AuthModule,
    RelationshipModule,
    MediaModule,
    WebsocketModule,
    PostModule,
    ReactionModule,
    PaginationModule,
    ResendModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
