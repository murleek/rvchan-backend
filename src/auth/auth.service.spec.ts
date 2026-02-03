import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

import { UsersService } from 'src/users/users.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<Repository<RefreshTokenEntity>>;

  const mockUsersService = {
    validate: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockRepo = {
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'user@example.com',
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get(AuthService);
    repo = module.get(getRepositoryToken(RefreshTokenEntity));
  });

  afterEach(() => jest.clearAllMocks());

  it('register', async () => {
    mockUsersService.create.mockResolvedValue({ id: 1 });

    const res = await service.register('user@example.com', 'password');

    expect(res.id).toBe(1);
  });

  it('login', async () => {
    mockUsersService.validate.mockResolvedValue(mockUser);
    mockJwtService.signAsync
      .mockResolvedValueOnce('access')
      .mockResolvedValueOnce('refresh');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');

    const res = await service.login(
      'user@example.com',
      'password',
      '127.0.0.1',
      'User-Agent',
    );

    expect(res.accessToken).toBe('access');
    expect(repo.save).toHaveBeenCalled();
  });

  it('refresh success', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 1 });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('refresh-hash');

    repo.find.mockResolvedValue([
      {
        id: 1,
        tokenHash: 'refresh-hash',
        user: mockUser,
      } as any,
    ]);

    mockJwtService.signAsync
      .mockResolvedValueOnce('access')
      .mockResolvedValueOnce('refresh');

    const res = await service.refresh('refresh-old', '127.0.0.1', 'User-Agent');

    expect(res.accessToken).toBe('access');
  });

  it('refresh invalid token', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 1 });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    repo.find.mockResolvedValue([]);

    await expect(
      service.refresh('refresh-bad', '127.0.0.1', 'User-Agent'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logout', async () => {
    const res = await service.logout(1);

    expect(repo.delete).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('getUserDevices', async () => {
    repo.find.mockResolvedValue([
      {
        id: 1,
        ip: '127.0.0.1',
        userAgent: 'User-Agent',
      },
    ] as any);

    const res = await service.getUserDevices(1);

    expect(res[0].ip).toBe('127.0.0.1');
  });
});
