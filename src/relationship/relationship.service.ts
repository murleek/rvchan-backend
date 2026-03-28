import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFollowsEntity } from './entities/user-follows.entity';
import { Repository } from 'typeorm';
import { UserBlocksEntity } from './entities/user-blocks.entity';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectRepository(UserFollowsEntity)
    private readonly followsRepo: Repository<UserFollowsEntity>,

    @InjectRepository(UserBlocksEntity)
    private readonly blockRepo: Repository<UserBlocksEntity>,
  ) {}

  async block(userAId: number, userBId: number) {
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

  async getFriends(userId: number) {
    return this.followsRepo
      .createQueryBuilder('r1')
      .innerJoin(
        'user_follows_entity',
        'r2',
        'r1.followerId = r2.followingId AND r1.followingId = r2.followerId',
      )
      .where('r1.followerId = :userId', { userId })
      .getMany();
  }

  async getFollowers(userId: number) {
    return this.followsRepo.find({
      where: { following: { id: userId } },
    });
  }

  async getFollowing(userId: number) {
    return this.followsRepo.find({
      where: { follower: { id: userId } },
    });
  }
}
