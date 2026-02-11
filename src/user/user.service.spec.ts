import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/public-user.mapper';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<UserEntity>>;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUser: UserEntity = {
    id: 1,
    email: 'user@example.com',
    password: 'password',
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should return user if credentials are valid', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validate('user@example.com', 'password');

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);

      await expect(
        service.validate('user@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.validate('user@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('create', () => {
    it('should create user and return public user', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      jest.spyOn(UserMapper, 'toPublic').mockReturnValue({
        id: 1,
        email: 'user@example.com',
      } as any);

      repo.save.mockResolvedValue(mockUser);

      const result = await service.create('user@example.com', 'password');

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, email: 'user@example.com' });
    });
  });

  describe('getMe', () => {
    it('should return public user', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(UserMapper, 'toPublic').mockReturnValue({
        id: 1,
        email: 'user@example.com',
      } as any);

      const result = await service.getMe(1);

      expect(result).toEqual({ id: 1, email: 'user@example.com' });
    });

    it('should throw NotFoundException if user not exists', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(service.getMe(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return public users list', async () => {
      repo.find.mockResolvedValue([mockUser]);

      jest.spyOn(UserMapper, 'toPublic').mockReturnValue({
        id: 1,
        email: 'user@example.com',
      } as any);

      const result = await service.findAll();

      expect(result).toEqual([{ id: 1, email: 'user@example.com' }]);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      repo.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('user@example.com');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      repo.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
