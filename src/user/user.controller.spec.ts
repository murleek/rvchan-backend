import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { UserEntity } from './entities/user.entity';

import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  // Mock UsersService
  const mockUsersService = {
    findAll: jest.fn(() => [
      { id: 1, email: 'user@example.com', password: 'password' },
    ]),
    getMe: jest.fn((id: number) => ({
      id,
      email: undefined,
      password: undefined,
    })),
  };

  const mockUser: UserEntity = {
    id: 1,
    email: 'user@example.com',
    password: 'password',
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return a current user', async () => {
      const publicUser = { id: 1, email: 'user@example.com' };
      usersService.getMe.mockResolvedValue(publicUser as any);

      const response = await controller.getMe(mockUser);

      expect(response).toEqual(publicUser);
      expect(usersService.getMe).toHaveBeenCalledWith(1);
    });
  });
});
