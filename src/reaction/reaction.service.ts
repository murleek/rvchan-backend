import { Injectable } from '@nestjs/common';
import { TreeRepository } from 'typeorm';
import { ReactionEntity } from './entities/reaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/post/entities/post.entity';

@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(ReactionEntity)
    private readonly reactRepo: TreeRepository<ReactionEntity>,

    @InjectRepository(PostEntity)
    private readonly postRepo: TreeRepository<PostEntity>,
  ) {}

  async getReactionsForPost(postId: number) {
    return this.reactRepo.count({
      where: { postId },
      relations: ['user'],
    });
  }

  async isLikedByUser(postId: number, userId: number) {
    const reaction = await this.reactRepo.findOne({
      where: { postId, userId },
    });

    return reaction ? reaction.reaction : null;
  }

  async setReaction(postId: number, userId: number, type: 'like' | 'dislike') {
    const reaction = await this.reactRepo.findOne({
      where: { postId, userId },
    });

    if (reaction) {
      if (reaction.reaction === type) {
        await this.reactRepo.remove(reaction);
        await this.postRepo.decrement({ id: postId }, 'likeCount', 1);
        return { postId: postId, action: 'removed', reaction: type };
      } else {
        reaction.reaction = type;
        await this.reactRepo.save(reaction);
        return { postId: postId, action: 'updated', reaction: type };
      }
    } else {
      await this.reactRepo.save({ postId, userId, reaction: type });
      await this.postRepo.increment({ id: postId }, 'likeCount', 1);
      return { postId: postId, action: 'created', reaction: type };
    }
  }
}
