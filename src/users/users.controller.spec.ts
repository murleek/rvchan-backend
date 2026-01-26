import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController (Zod)', () => {
  let controller: UsersController;
  let service: UsersService;

  // Mock UsersService
  const mockUsersService = {
    create: jest.fn((email: string, password: string) => ({
      id: 1,
      email,
      password,
    })),
    findAll: jest.fn(() => [
      { id: 1, email: 'test@mail.com', password: '123456' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user', () => {
    const dto = {
      email: 'test@mail.com',
      password: '123456',
    };

    const result = controller.create(dto);

    expect(result).toEqual({
      id: 1,
      email: dto.email,
      password: dto.password,
    });

    expect(mockUsersService.create).toHaveBeenCalledWith(
      dto.email,
      dto.password,
    );
  });

  it('should return all users', () => {
    const result = controller.findAll();

    expect(result).toEqual([
      { id: 1, email: 'test@mail.com', password: '123456' },
    ]);

    expect(mockUsersService.findAll).toHaveBeenCalled();
  });
});
