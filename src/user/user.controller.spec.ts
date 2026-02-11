import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';

import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { SessionsService } from 'src/sessions/sessions.service';

describe('UserController', () => {
  let controller: UserController;
  let sessionsService: jest.Mocked<SessionsService>;

  const mockRequest = {
    user: {
      id: 1,
    },
  };

  const mockSessionsService = {
    getUserDevices: jest.fn(),
    logoutDevice: jest.fn(),
  };

  const mockUser: UserEntity = {
    id: 1,
    email: 'user@example.com',
    password: 'password',
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: SessionsService, useValue: mockSessionsService }],
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

    controller = module.get<UserController>(UserController);
    sessionsService = module.get(SessionsService);
  });

  describe('GET /user/devices', () => {
    it('should return user devices', async () => {
      const devices = [];

      mockSessionsService.getUserDevices.mockResolvedValue(devices);

      const result = await controller.me(mockRequest as any);

      expect(sessionsService.getUserDevices).toHaveBeenCalledWith(1);
      expect(result).toEqual(devices);
    });
  });

  describe('DELETE /user/devices', () => {
    it('should revoke device', async () => {
      const dto = { deviceId: '00000000-0000-0000-0000-000000000000' };

      mockSessionsService.logoutDevice.mockResolvedValue({
        success: true,
      });

      const result = await controller.revokeDevice(mockRequest as any, dto);

      expect(sessionsService.logoutDevice).toHaveBeenCalledWith(
        1,
        '00000000-0000-0000-0000-000000000000',
      );
      expect(result).toEqual({ success: true });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
