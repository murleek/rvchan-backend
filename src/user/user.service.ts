import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/public-user.mapper';
import { InitUserRequest } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async validate(email: string, password: string): Promise<UserEntity> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async create(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);

    let user = await this.usersRepo.save({
      email,
      password: hash,
    });

    return UserMapper.toPublic(user);
  }

  async getUser(id: number) {
    const userFromDb = await this.findById(id);

    if (!userFromDb) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.toPublic(userFromDb);
  }

  findAll() {
    return this.usersRepo
      .find()
      .then((users) => users.map(UserMapper.toPublic));
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: number) {
    return this.usersRepo.findOne({ where: { id } });
  }

  async isUsernameTaken(username: string, user: UserEntity) {
    const findedUser = await this.usersRepo.findOne({ where: { username } });
    if (username === `id${user.id}`) {
      return false;
    }
    return !!findedUser && findedUser.id !== user.id;
  }

  async initUser(id: number, dto: InitUserRequest) {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.username = dto.username;
    user.firstName = dto.firstName;
    if (dto.lastName) {
      user.lastName = dto.lastName;
    }
    if (dto.description) {
      user.description = dto.description;
    }
    if (user.state === 'INIT') {
      user.state = 'ACTIVE';
    }

    await this.usersRepo.save(user);
  }
}
