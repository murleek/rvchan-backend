import { Inject, Injectable } from '@nestjs/common';
import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }

  // --- Counters ---

  incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  incrBy(key: string, value: number): Promise<number> {
    return this.redis.incrby(key, value);
  }

  // --- Basic get/set ---

  get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  set(key: string, value: string): Promise<'OK'> {
    return this.redis.set(key, value);
  }

  /**
   * Set with expiry in seconds
   */
  setex(key: string, ttl: number, value: string): Promise<'OK'> {
    return this.redis.setex(key, ttl, value);
  }

  /**
   * Set only if key does not exist. Returns true if set, false if already existed.
   */
  async setnx(key: string, value: string): Promise<boolean> {
    const result = await this.redis.setnx(key, value);
    return result === 1;
  }

  /**
   * Set with expiry in seconds, only if key does not exist.
   * Useful for distributed locks.
   */
  async setExIfNotExists(
    key: string,
    ttl: number,
    value: string,
  ): Promise<boolean> {
    const result = await this.redis.set(key, value, 'EX', ttl, 'NX');
    return result === 'OK';
  }

  // --- Expiry ---

  /**
   * Set TTL on an existing key (seconds)
   */
  expire(key: string, ttl: number): Promise<number> {
    return this.redis.expire(key, ttl);
  }

  ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  // --- Deletion ---

  del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  delMany(keys: string[]): Promise<number> {
    if (!keys.length) return Promise.resolve(0);
    return this.redis.del(...keys);
  }

  exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  // --- JSON helpers ---

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setJson<T>(key: string, value: T): Promise<'OK'> {
    return this.redis.set(key, JSON.stringify(value));
  }

  setJsonEx<T>(key: string, ttl: number, value: T): Promise<'OK'> {
    return this.redis.setex(key, ttl, JSON.stringify(value));
  }

  // --- Hash ---

  hset(key: string, field: string, value: string): Promise<number> {
    return this.redis.hset(key, field, value);
  }

  hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  hdel(key: string, field: string): Promise<number> {
    return this.redis.hdel(key, field);
  }

  // --- Sets ---

  sadd(key: string, ...members: string[]): Promise<number> {
    return this.redis.sadd(key, ...members);
  }

  srem(key: string, ...members: string[]): Promise<number> {
    return this.redis.srem(key, ...members);
  }

  smembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }

  sismember(key: string, member: string): Promise<number> {
    return this.redis.sismember(key, member);
  }

  // --- Pub/Sub ---

  publish(channel: string, message: string): Promise<number> {
    return this.redis.publish(channel, message);
  }

  // --- Pipeline (batch) ---

  /**
   * Execute multiple commands in a single round-trip.
   * @example
   * await redis.pipeline((pipe) => {
   *   pipe.incr('counter');
   *   pipe.expire('counter', 300);
   * });
   */
  async pipeline(
    fn: (pipe: ReturnType<Redis['pipeline']>) => void,
  ): Promise<void> {
    const pipe = this.redis.pipeline();
    fn(pipe);
    await pipe.exec();
  }
}
