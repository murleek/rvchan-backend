import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from './guards/jwt.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UserService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    getUserDevices: jest.fn(),
    logout: jest.fn(),
  };

  const mockUserService = {
    getUser: jest.fn(),
  };

  const mockUser = {
    id: 1,
    deviceId: '00000000-0000-0000-0000-000000000000',
  };

  const mockReq = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'User-Agent',
    },
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
    userService = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /auth/register', () => {
    it('register', async () => {
      authService.register.mockResolvedValue({
        id: 1,
        email: 'testuser@example.com',
      } as any);

      const res = await controller.register({
        email: 'testuser@example.com',
        password: 'password',
      });

      expect(res).toEqual({ id: 1, email: 'testuser@example.com' });
    });
  });

  describe('POST /auth/login', () => {
    it('login', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const res = await controller.login(mockReq, {
        email: 'testuser@example.com',
        password: 'password',
      });

      expect(authService.login).toHaveBeenCalled();
      expect(res.accessToken).toBe('access');
      expect(res.refreshToken).toBe('refresh');
    });
  });

  describe('POST /auth/refresh', () => {
    it('refresh tokens', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const res = await controller.refresh(mockReq, {
        refreshToken: 'old',
      });

      expect(res.accessToken).toBe('access');
      expect(res.refreshToken).toBe('refresh');
    });
  });

  describe('GET /auth/profile', () => {
    it('should return a current user', async () => {
      const publicUser = { id: 1, email: 'user@example.com' };
      userService.getUser.mockResolvedValue(publicUser as any);

      const response = await controller.getMe(mockReq.user);

      expect(response).toEqual(publicUser);
      expect(userService.getUser).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /auth/logout', () => {
    it('logout', async () => {
      authService.logout.mockResolvedValue({ statusCode: 200 });

      const res = await controller.logout(mockReq);

      expect(res.statusCode).toBe(200);
      expect(authService.logout).toHaveBeenCalledWith(
        '00000000-0000-0000-0000-000000000000',
      );
    });
  });
});
