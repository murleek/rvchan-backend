import { Inject, Injectable } from '@nestjs/common';
import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
