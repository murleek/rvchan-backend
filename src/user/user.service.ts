import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/public-user.mapper';
import { EditProfileDto, InitUserRequest, PublicUser } from './dto/user.dto';
import { RelationshipService } from 'src/relationship/relationship.service';
import { MultipartFile } from '@fastify/multipart';
import { PathType, R2Provider, SIZES } from 'src/media/r2.provider';
import sharp from 'sharp';
import { ONLINE_KEY } from 'src/redis/redis.keys';
import { RedisService } from 'src/redis/redis.service';

const RESERVED_USERNAMES = [
  'login',
  'register',
  'init',
  'logout',
  'home',
  'notifications',
  'search',
  'settings',
];

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,

    private readonly relationshipService: RelationshipService,
    private readonly redisService: RedisService,
    private readonly cf: R2Provider,
  ) {}

  async validate(email: string, password: string): Promise<UserEntity> {
    const user = await this.findByEmail(email, { select: ['id', 'password'] });

    if (!user) {
      throw new UnauthorizedException('invalid_credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('invalid_credentials');
    }

    return user;
  }

  async getPublicUser(user: UserEntity): Promise<PublicUser> {
    const userPublic = UserMapper.toPublic(user);

    try {
      if (user.avatarId) {
        userPublic.avatar = await this.cf.getAllDownloadUrl(user.avatarId);
      }
    } catch (e) {
      console.error('Error fetching avatar URL:', e);
    }

    userPublic.lastActiveAt = await this.getOnlineStatus(user);

    return userPublic;
  }

  async getShortPublicUser(user: UserEntity) {
    const userPublic = UserMapper.toShortPublic(user);

    try {
      if (user.avatarId) {
        userPublic.avatar = await this.cf.getAllDownloadUrl(user.avatarId);
      }
    } catch (e) {
      console.error('Error fetching avatar URL:', e);
    }

    return userPublic;
  }

  async create(email: string, passwordHash: string) {
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('user_exists');
    }

    const user = await this.usersRepo.save({
      email,
      password: passwordHash,
    });

    return await this.getPublicUser(user);
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

    return await this.getPublicUser(updatedUser);
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

  //   user.avatar = fileId;
  //   await this.usersRepo.save(user);

  //   return await this.getPublicUser(user);
  // }

  async getUser(id: number) {
    const userFromDb = await this.findById(id);

    if (!userFromDb) {
      throw new BadRequestException('User not found');
    }

    return await this.getPublicUser(userFromDb);
  }

  async findByEmail(
    email: string,
    options: Omit<FindOneOptions<UserEntity>, 'where'> = {},
  ) {
    return this.usersRepo.findOne({ where: { email }, ...options });
  }

  async findById(id: number) {
    return this.usersRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .loadRelationCountAndMap('user.followers', 'user.followers')
      .loadRelationCountAndMap('user.following', 'user.following')
      .getOne();
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

    return await this.getPublicUser(userFromDb);
  }

  validateUsername(username: string) {
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

    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      return 'invalidUsername';
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
      .limit(8)
      .getRawAndEntities();

    return Promise.all(
      shit.entities.map(async (u) => await this.getShortPublicUser(u)),
    );
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
      PathType.AVATAR,
    );

    await this.usersRepo.save({ ...currentUser, avatarId: file.id });

    return { ok: true };
  }

  async updateLastActive(id: number) {
    await this.usersRepo.update({ id }, { lastActiveAt: new Date() });
  }

  async getOnlineStatus(user: number | UserEntity) {
    if (typeof user === 'number') {
      const userDB = await this.usersRepo.findOne({ where: { id: user } });
      if (!userDB) {
        throw new NotFoundException('User not found');
      }
      user = userDB;
    }

    if (user.lastActiveAt.getTime() > Date.now() - 60 * 1000) {
      return 'now';
    }

    if (await this.redisService.exists(ONLINE_KEY(user.id))) {
      return 'now';
    }

    return user.lastActiveAt;
  }
}
