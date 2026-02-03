import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    getUserDevices: jest.fn(),
    logout: jest.fn(),
  };

  const mockReq = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'jest',
    },
    user: {
      userId: 1,
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt-access'))
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: 1 };
          return true;
        },
      })
      .compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

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

  it('refresh', async () => {
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

  it('get devices', async () => {
    authService.getUserDevices.mockResolvedValue([]);

    const res = await controller.me(mockReq);

    expect(authService.getUserDevices).toHaveBeenCalledWith(1);
    expect(res).toEqual([]);
  });

  it('logout', async () => {
    authService.logout.mockResolvedValue({ statusCode: 200 });

    const res = await controller.logout(mockReq);

    expect(res.statusCode).toBe(200);
  });
});
