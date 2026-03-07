import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
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
      throw new UnauthorizedException('invalid_credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('invalid_credentials');
    }

    return user;
  }

  async create(email: string, password: string) {
    let existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('user_exists');
    }

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

  async getUserByUsername(username: string) {
    const validationResult = this.validateUsername(username);
    if (validationResult && validationResult !== 'reservedId') {
      throw new BadRequestException(validationResult);
    }

    if (validationResult === 'reservedId') {
      const userId = Number(username.slice(2));
      const userById = await this.getUser(userId);

      if (!userById) {
        throw new NotFoundException('User not found');
      }

      return userById;
    }

    const userFromDb = await this.usersRepo.findOne({
      where: { username: ILike(username) },
    });

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

  validateUsername(username) {
    if (username.startsWith('id')) {
      const reservedId = username.slice(2);
      if (/^\d+$/.test(reservedId) && Number(reservedId) > 0) {
        return 'reservedId';
      }
    }
    if (username.length < 5) {
      return 'minLength';
    }
    if (username.length > 32) {
      return 'maxLength';
    }

    if (/[^A-Za-z0-9_.]/.test(username)) {
      return 'invalidCharacters';
    }

    if (!/^[A-Za-z]/.test(username)) {
      return 'startWithLetter';
    }

    if (!/[A-Za-z0-9]$/.test(username)) {
      return 'endWithLetterOrDigit';
    }

    if (/(\.|_){2}/.test(username)) {
      return 'consecutiveDotsUnderscores';
    }

    return null;
  }

  async isUsernameAvailable(username: string, user: UserEntity) {
    const validationResult = this.validateUsername(username);
    const isReservedForUser =
      validationResult === 'reservedId' &&
      Number(username.slice(2)) === user.id;

    if (validationResult && !isReservedForUser) {
      return {
        available: false,
        message: validationResult,
      };
    }

    const findedUser = await this.usersRepo.findOne({
      where: { username: ILike(username) },
    });

    return { available: !findedUser || findedUser.id === user.id };
  }

  async initUser(id: number, dto: InitUserRequest) {
    if (!dto.username) {
      dto.username = `id${id}`;
    }

    const usernameCheck = await this.isUsernameAvailable(dto.username, {
      id,
    } as UserEntity);

    if (!usernameCheck.available) {
      throw new BadRequestException(usernameCheck);
    }

    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newUser = { ...user, ...dto, isPrivate: false } as UserEntity;

    if (newUser.state === 'INIT') {
      newUser.state = 'ACTIVE';
    }

    await this.usersRepo.save(newUser);
  }
}
