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
import { EditProfileDto, InitUserRequest } from './dto/user.dto';
import { RelationshipService } from 'src/relationship/relationship.service';
import { MediaService } from 'src/media/media.service';
import { MultipartFile } from '@fastify/multipart';
import { R2Provider, SIZES } from 'src/media/r2.provider';
import sharp from 'sharp';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,

    private readonly relationshipService: RelationshipService,
    private readonly cf: R2Provider,
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

  async editProfile(id: number, dto: EditProfileDto) {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.username) {
      const usernameCheck = await this.isUsernameAvailable(dto.username, user);
      if (!usernameCheck.available) {
        if (usernameCheck.message === 'reservedId') {
          dto.username = `id${user.id}`;
        } else {
          throw new BadRequestException(usernameCheck);
        }
      }
    }

    const updatedUser = { ...user, ...dto } as UserEntity;

    if (updatedUser.state === 'INIT') {
      updatedUser.state = 'ACTIVE';
    }

    await this.usersRepo.save(updatedUser);

    return UserMapper.toPublic(updatedUser);
  }

  // async setAvatar(id: number, fileId: string) {
  //   const user = await this.usersRepo.findOne({ where: { id } });

  //   if (!user) {
  //     throw new BadRequestException('User not found');
  //   }

  //   const media = await this.media.findById(fileId);
  //   console.log('media', media);
  //   if (!media) {
  //     throw new BadRequestException('File not found');
  //   }

  //   user.avatarUrl = fileId;
  //   await this.usersRepo.save(user);

  //   return UserMapper.toPublic(user);
  // }

  async getUser(id: number) {
    const userFromDb = await this.findById(id);

    if (!userFromDb) {
      throw new BadRequestException('User not found');
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
    return this.usersRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .loadRelationCountAndMap('user.followers', 'user.followers')
      .loadRelationCountAndMap('user.following', 'user.following')
      .getOne();
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByUsername(username: string) {
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

    const userFromDb = await this.usersRepo
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .loadRelationCountAndMap('user.followers', 'user.followers')
      .loadRelationCountAndMap('user.following', 'user.following')
      .getOne();

    if (!userFromDb) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.toPublic(userFromDb);
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
  async searchUsers(search: string) {
    const words = search.trim().split(/\s+/); // ['raido', 'ra']
    const tsQuery = words.map((w) => `${w}:*`).join(' & '); // 'raido:* & ra:*'

    const shit = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect(
        `
      ts_rank(u.search_vector, to_tsquery('simple', :tsQuery)) * 2
      + similarity(u.username, :search) * 3
      + similarity(u."firstName", :search) * 1.5
      + CASE WHEN u.username ILIKE :search THEN 5 ELSE 0 END
        `,
        'rank',
      )
      .where('u.state = :state', { state: 'ACTIVE' })
      .andWhere(
        `u.search_vector @@ to_tsquery('simple', :tsQuery) 
      OR u.username % :search`,
      )
      .orderBy('rank', 'DESC')
      .setParameters({ search, tsQuery })
      .limit(20)
      .getRawAndEntities();

    return shit.entities.map(UserMapper.toShortPublic);
  }

  async getUserProfile(currentUser: UserEntity, username: string) {
    let user = await this.findByUsername(username);

    const isMine = currentUser && user.id === currentUser.id;
    if (currentUser && !isMine) {
      const isFollowing = await this.relationshipService.isFollowing(
        currentUser.id,
        user.id,
      );
      const isFollowed = await this.relationshipService.isFollowing(
        user.id,
        currentUser.id,
      );
      user = { ...user, isFollowed, isFollowing };
    }
    return { ...user, isMine };
  }

  async uploadAvatar(currentUser: UserEntity, avatar: MultipartFile) {
    const buffer = await avatar.toBuffer();

    const image = sharp(buffer).rotate().resize({
      width: SIZES[0],
      height: SIZES[0],
      fit: 'cover',
    });

    const file = await this.cf.uploadFile(
      {
        buffer: await image.toBuffer(),
        filename: avatar.filename,
        mimetype: avatar.mimetype,
        isBuffer: true,
      },
      currentUser,
    );

    await this.usersRepo.save({ ...currentUser, avatarUrl: file.id });

    return { ok: true };
  }

  async updateLastActive(id: number) {
    await this.usersRepo.update({ id }, { lastActiveAt: new Date() });
  }
}
