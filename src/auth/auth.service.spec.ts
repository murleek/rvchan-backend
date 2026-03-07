import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { SessionsEntity } from '../sessions/entities/sessions.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<Repository<SessionsEntity>>;

  const mockUserService = {
    validate: jest.fn(),
    create: jest.fn(),
    getUser: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockRepo = {
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'user@example.com',
  } as any;

  beforeEach(async () => {
    jest
      .spyOn(global.crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-0000-0000-000000000000');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: getRepositoryToken(SessionsEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get(AuthService);
    repo = module.get(getRepositoryToken(SessionsEntity));
  });

  afterEach(() => jest.clearAllMocks());

  it('register', async () => {
    mockUserService.create.mockResolvedValue({ id: 1 });

    const res = await service.register('user@example.com', 'password');

    expect(mockUserService.create).toHaveBeenCalledWith(
      'user@example.com',
      'password',
    );
    expect(res.id).toBe(1);
  });

  it('login success', async () => {
    mockUserService.validate.mockResolvedValue(mockUser);

    mockJwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    (bcrypt.hash as jest.Mock).mockResolvedValue('refresh-hash');

    const res = await service.login(
      'user@example.com',
      'password',
      '127.0.0.1',
      'User-Agent',
    );

    expect(res.accessToken).toBe('access-token');
    expect(res.refreshToken).toBe('refresh-token');

    expect(repo.save).toHaveBeenCalled();
  });

  describe('refresh tokens', () => {
    it('refresh success', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        deviceId: '00000000-0000-0000-0000-000000000000',
      });

      repo.findOne.mockResolvedValue({
        id: 1,
        deviceId: '00000000-0000-0000-0000-000000000000',
        tokenHash: 'refresh-hash',
        user: mockUser,
      } as any);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('refresh-new-hash');

      mockJwtService.signAsync
        .mockResolvedValueOnce('access-new')
        .mockResolvedValueOnce('refresh-new');

      const res = await service.refresh(
        'refresh-old',
        '127.0.0.1',
        'User-Agent',
      );

      expect(res.accessToken).toBe('access-new');
      expect(res.refreshToken).toBe('refresh-new');
      expect(repo.save).toHaveBeenCalled();
    });

    it('refresh invalid token (jwt error)', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error());

      await expect(service.refresh('refresh-bad', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('refresh invalid token (session not found)', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        deviceId: '00000000-0000-0000-0000-000000000000',
      });

      repo.findOne.mockResolvedValue(null);

      await expect(service.refresh('refresh-old', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('refresh invalid token (hash mismatch)', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        deviceId: '00000000-0000-0000-0000-000000000000',
      });

      repo.findOne.mockResolvedValue({
        id: 1,
        deviceId: '00000000-0000-0000-0000-000000000000',
        tokenHash: 'refresh-hash',
        user: mockUser,
      } as any);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('refresh-bad', '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  it('logout', async () => {
    const res = await service.logout('00000000-0000-0000-0000-000000000000');

    expect(repo.delete).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
