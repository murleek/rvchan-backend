import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFollowsEntity } from './entities/user-follows.entity';
import { Repository } from 'typeorm';
import { UserBlocksEntity } from './entities/user-blocks.entity';
import { UserService } from 'src/user/user.service';
import { PaginationService } from 'src/pagination/pagination.service';
import { ShortPublicUser } from 'src/user/dto/user.dto';
import { CursorPaginationDto } from 'src/pagination/dto/cursor-pagination.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectRepository(UserFollowsEntity)
    private readonly followsRepo: Repository<UserFollowsEntity>,

    @InjectRepository(UserBlocksEntity)
    private readonly blockRepo: Repository<UserBlocksEntity>,

    private eventEmitter: EventEmitter2,
    private readonly pagination: PaginationService,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async block(userAId: number, userBId: number) {
    if (userAId === userBId) {
      throw new BadRequestException('cannot-follow-self');
    }

    await this.followsRepo.delete([
      { follower: { id: userAId }, following: { id: userBId } },
      { follower: { id: userBId }, following: { id: userAId } },
    ]);

    if (await this.isBlocked(userAId, userBId)) {
      throw new BadRequestException('already-blocked');
    }

    await this.blockRepo.save({
      blocker: { id: userAId },
      blocked: { id: userBId },
    });

    return { success: true, blocked: userBId };
  }

  async unblock(userAId: number, userBId: number) {
    await this.blockRepo.delete({
      blocker: { id: userAId },
      blocked: { id: userBId },
    });

    return { success: true };
  }

  async isBlocked(userAId: number, userBId: number) {
    return !!(await this.blockRepo.findOne({
      where: [
        { blocker: { id: userAId }, blocked: { id: userBId } },
        { blocker: { id: userBId }, blocked: { id: userAId } },
      ],
    }));
  }

  async follow(userAId: number, userBId: number) {
    if (userAId === userBId) {
      throw new BadRequestException('cannot-follow-self');
    }
    if (await this.isBlocked(userAId, userBId)) {
      throw new BadRequestException('user-blocked');
    }

    if (await this.isFollowing(userAId, userBId)) {
      throw new BadRequestException('already-following');
    }

    await this.followsRepo.save({
      follower: { id: userAId },
      following: { id: userBId },
    });

    if (await this.isFollowing(userBId, userAId)) {
      // await this.notificationService.followAccepted(
      //   userAId.toString(),
      //   userBId.toString(),
      // );
      this.eventEmitter.emit('user.follow.accepted', {
        actorId: userAId,
        targetId: userBId,
      });
    } else {
      // await this.notificationService.follow(
      //   userAId.toString(),
      //   userBId.toString(),
      // );
      this.eventEmitter.emit('user.followed', {
        actorId: userAId,
        targetId: userBId,
      });
    }

    return { success: true };
  }

  async unfollow(userAId: number, userBId: number) {
    await this.followsRepo.delete({
      follower: { id: userAId },
      following: { id: userBId },
    });

    return { success: true };
  }

  async isFollowing(userAId: number, userBId: number) {
    return !!(await this.followsRepo.findOne({
      where: { follower: { id: userAId }, following: { id: userBId } },
    }));
  }

  async isFriends(userAId: number, userBId: number) {
    return !!(await this.followsRepo.findOne({
      where: [
        { follower: { id: userAId }, following: { id: userBId } },
        { follower: { id: userBId }, following: { id: userAId } },
      ],
    }));
  }

  async getFriends(username: string, dto?: CursorPaginationDto) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new BadRequestException('user-not-found');
    }
    return this.followsRepo
      .createQueryBuilder('r1')
      .innerJoin(
        'user_follows_entity',
        'r2',
        'r1.followerId = r2.followingId AND r1.followingId = r2.followerId',
      )
      .where('r1.followerId = :userId', { userId: user.id })
      .getMany();
  }

  async getFollowers(username: string, dto?: CursorPaginationDto) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new BadRequestException('user-not-found');
    }

    // const followers = await this.followsRepo.find({
    //   where: { following: { id: user.id } },
    //   relations: ['follower'],
    // });

    return await this.pagination.paginate<UserFollowsEntity, ShortPublicUser>(
      this.followsRepo
        .createQueryBuilder('entity')
        .leftJoinAndSelect('entity.follower', 'follower')
        .where('entity.followingId = :userId', {
          userId: user.id,
        }),
      {
        limit: dto?.limit ? Math.min(dto?.limit, 20) : 20,
        after: dto?.after,
        before: dto?.before,
      },
      {
        type: 'cursor',
        cursorField: 'id',
        order: 'DESC',
        map: async (user) =>
          await this.userService.getShortPublicUser(user.follower),
      },
    );
  }

  async getFollowing(username: string, dto?: CursorPaginationDto) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new BadRequestException('user-not-found');
    }

    // const followers = await this.followsRepo.find({
    //   where: { following: { id: user.id } },
    //   relations: ['follower'],
    // });

    return await this.pagination.paginate<UserFollowsEntity, ShortPublicUser>(
      this.followsRepo
        .createQueryBuilder('entity')
        .leftJoinAndSelect('entity.following', 'following')
        .where('entity.followerId = :userId', {
          userId: user.id,
        }),
      {
        limit: dto?.limit ? Math.min(dto?.limit, 20) : 20,
        after: dto?.after,
        before: dto?.before,
      },
      {
        type: 'cursor',
        cursorField: 'id',
        order: 'DESC',
        map: async (user) =>
          await this.userService.getShortPublicUser(user.following),
      },
    );
  }
}
