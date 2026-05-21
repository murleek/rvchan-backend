import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PostEntity } from './entities/post.entity';
import { ICurrentUser } from 'src/user/types/user.types';
import { PostMapper } from './mapper/post.mapper';
import { PaginationService } from 'src/pagination/pagination.service';
import { CursorPaginationDto } from 'src/pagination/dto/cursor-pagination.dto';
import { PublicPost, PublicThread } from './dto/post.dto';
import { UserService } from 'src/user/user.service';
import { TextEntity } from './types/post.types';
import { CursorPaginated } from 'src/pagination/interfaces/cursor-pagination.interface';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: TreeRepository<PostEntity>,
    @InjectQueue('posting')
    private postingQueue: Queue,
    private readonly pagination: PaginationService,
    private readonly user: UserService,
  ) {}

  LINK_REGEX = /\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]}]/gi;
  MENTION_REGEX = /(^|[^A-Za-z0-9_])@([A-Za-z][A-Za-z0-9_.]{4,31})\b/g;

  createEntities(text: string) {
    const entities: TextEntity[] = [];

    // ссылки
    for (const match of text.matchAll(this.LINK_REGEX)) {
      entities.push({
        type: 'link',
        url: match[0],
        from: match.index,
        to: match.index + match[0].length,
      });
    }

    // упоминания
    for (const match of text.matchAll(this.MENTION_REGEX)) {
      const username = match[2];

      if (!this.user.validateUsername(username)) {
        const fullMatch = `@${username}`;
        const start = match.index + match[1].length;

        entities.push({
          type: 'mention',
          username: username,
          from: start,
          to: start + fullMatch.length,
        });
      }
    }

    return entities.sort((a, b) => a.from - b.from);
  }

  async createPost(
    data: { content: string; parentId?: number },
    user: ICurrentUser,
  ) {
    if (data.parentId) {
      const parent = await this.postRepo.findOne({
        where: { id: data.parentId },
      });
      if (!parent) throw new NotFoundException('Thread not found');
    }
    const content = data.content.trim();

    if (content.length > 2000) {
      throw new BadRequestException('Content too long');
    }
    if (content.replaceAll(/\p{White_Space}/gu, '').length === 0) {
      throw new BadRequestException('Content cannot be empty');
    }
    // Добавляем в очередь
    const job = await this.postingQueue.add(
      'create-post',
      {
        postData: {
          content,
          parentId: data.parentId,
        },
        user: user,
      },
      {
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        delay: 1000,
        attempts: 4,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return {
      jobId: job.id,
      status: 'queued',
    };
  }

  async deletePost(postId: number, user: ICurrentUser) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.user.id !== user.id) throw new NotFoundException('Post not found');

    post.isDeleted = true;
    await this.postRepo.save(post);
    return { ok: true };
  }

  async getPublicPost(post: PostEntity): Promise<PublicPost> {
    const publicPost = PostMapper.toPublicPost(post);
    const user = await this.user.getShortPublicUser(post.user);

    return { ...publicPost, user };
  }

  async getPublicThread(
    post: PostEntity,
    parents: PostEntity[],
    replies: CursorPaginated<PublicPost>,
  ): Promise<PublicThread> {
    const publicThread = PostMapper.toPublicThread(post);
    const user = await this.user.getShortPublicUser(post.user);
    console.log(parents);

    return {
      ...publicThread,
      user,
      replies,
      parents: parents.map((p) => PostMapper.toPublicPost(p)),
    };
  }

  async cancelPost(jobId: string, user: ICurrentUser) {
    const job = await this.postingQueue.getJob(jobId);
    if (!job || job.data.user.id !== user.id)
      throw new NotFoundException('Job not found');

    await job.remove();
    return { ok: true };
  }

  async getThread(postId: number, username: string) {
    if (!username) {
      throw new NotFoundException('Thread not found');
    }

    const thread = await this.postRepo.findOne({
      where: { id: postId, user: { username }, isDeleted: false },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    if (!thread) throw new NotFoundException('Thread not found');

    const parents = (await this.postRepo.findAncestors(thread)).filter(
      (p) => p.id !== thread.id,
    );

    const replies = await this.getReplies(thread.id);

    return await this.getPublicThread(thread, parents, replies);
  }

  async getReplies(
    parentId: number,
    dto?: CursorPaginationDto,
  ): Promise<CursorPaginated<PublicPost>> {
    return (await this.pagination.paginate<PostEntity, PublicPost>(
      this.postRepo
        .createQueryBuilder('entity')
        .leftJoinAndSelect('entity.user', 'user')
        .where('entity.parentId = :parentId', { parentId })
        .andWhere('entity.isDeleted = FALSE'),
      {
        limit: dto?.limit ? Math.min(dto?.limit, 20) : 20,
        after: dto?.after,
        before: dto?.before,
      },
      {
        type: 'cursor',
        cursorField: 'id',
        order: 'DESC',
        map: async (post) => await this.getPublicPost(post),
      },
    )) as CursorPaginated<PublicPost>;
  }

  async getUserThreads(username: string, dto?: CursorPaginationDto) {
    return await this.pagination.paginate<PostEntity, PublicPost>(
      this.postRepo
        .createQueryBuilder('entity')
        .leftJoinAndSelect('entity.user', 'user')
        .where('user.username = :username', { username })
        .andWhere('entity.parentId IS NULL')
        .andWhere('entity.isDeleted = FALSE'),
      {
        limit: dto?.limit ? Math.min(dto?.limit, 20) : 20,
        after: dto?.after,
        before: dto?.before,
      },
      {
        type: 'cursor',
        cursorField: 'id',
        order: 'DESC',
        map: async (post) => await this.getPublicPost(post),
      },
    );

    // return (
    //   await this.postRepo.find({
    //     where: { userId },
    //     relations: ['user'],
    //     order: { createdAt: 'ASC' },
    //   })
    // ).map((p) => PostMapper.toPublicPost(p));
  }
}
