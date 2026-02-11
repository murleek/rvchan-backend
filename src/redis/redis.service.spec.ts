import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

describe('RedisService', () => {
  let service: RedisService;
  let redisMock: Redis;

  beforeEach(async () => {
    redisMock = {
      quit: jest.fn().mockResolvedValue(undefined),
    } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService, { provide: 'REDIS', useValue: redisMock }],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call redis.quit on module destroy', async () => {
    await service.onModuleDestroy();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
