import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
        });
      },
    },
    RedisService,
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
