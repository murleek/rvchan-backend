import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import Redis from 'ioredis';
import { LessThan, Repository } from 'typeorm';
import { SessionsEntity } from './entities/sessions.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';

describe('SessionsService', () => {
  let service: SessionsService;
  let redisMock: Redis;
  let repoMock: Repository<SessionsEntity>;

  beforeEach(async () => {
    redisMock = {
      set: jest.fn().mockResolvedValue('OK'),
    } as any;

    repoMock = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      find: jest.fn().mockResolvedValue([
        {
          deviceId: '00000000-0000-0000-0000-000000000000',
          ip: '127.0.0.1',
          userAgent: 'User-Agent',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(),
          user: { id: 1 },
        },
      ]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: 'REDIS', useValue: redisMock },
        {
          provide: getRepositoryToken(SessionsEntity),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repoMock = module.get(getRepositoryToken(SessionsEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should logout device', async () => {
    const result = await service.logoutDevice(
      1,
      '00000000-0000-0000-0000-000000000000',
    );
    expect(redisMock.set).toHaveBeenCalled();
    expect(repoMock.delete).toHaveBeenCalledWith({
      deviceId: '00000000-0000-0000-0000-000000000000',
    });
    expect(result).toEqual({ affected: 1 });
  });

  it('should get user devices', async () => {
    const devices = await service.getUserDevices(1);
    expect(devices.length).toBe(1);
    expect(devices[0].id).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should delete expired sessions', async () => {
    const fakeDate = new Date('2026-02-11T10:00:00Z');
    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => fakeDate as unknown as Date);

    await service.cleanupExpiredSessions();

    expect(repoMock.delete).toHaveBeenCalledWith({
      expiresAt: LessThan(fakeDate),
    });
  });
});
