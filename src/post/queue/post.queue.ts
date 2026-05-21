// queue/posting.queue.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../entities/post.entity';
import { ICurrentUser } from 'src/user/types/user.types';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { PostService } from '../post.service';
import { NotificationService } from 'src/notification/notification.service';
import { UserService } from 'src/user/user.service';

@Processor('posting')
@Injectable()
export class PostingProcessor extends WorkerHost {
  constructor(
    @InjectRepository(PostEntity)
    private postRepo: Repository<PostEntity>,
    private readonly postService: PostService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private gateway: WebsocketGateway,
  ) {
    super();
  }

  async process(
    job: Job<{ postData: Partial<PostEntity>; user: ICurrentUser }>,
  ) {
    const { postData, user } = job.data;
    const entities = this.postService.createEntities(postData.content || '');

    const postSave = await this.postRepo.save({
      ...postData,
      type: postData.parentId ? 'reply' : 'thread',
      entities,
      user,
      queueJobId: job.id,
    });
    const post = await this.postRepo.findOne({
      where: {
        id: postSave.id,
      },
      relations: ['user'],
    });

    if (!post) {
      throw new Error('Post not found after saving');
    }
    let parentPost: PostEntity | null = null;

    if (postData.parentId)
      parentPost = await this.postRepo.findOne({
        where: {
          id: postData.parentId,
        },
        relations: ['user'],
      });

    const publicPost = await this.postService.getPublicPost(post);

    this.gateway.postCreated(
      {
        ...publicPost,
        parent: parentPost
          ? {
              id: parentPost.id,
              username: parentPost.user.username || '',
            }
          : undefined,
      },
      user,
      job.id,
    );

    const mentionedUsers = entities
      .filter((e) => e.type === 'mention')
      .map((e) => e.username);

    for (const username of mentionedUsers) {
      const mentionedUser = await this.userService.findByUsername(username);
      if (mentionedUser) {
        await this.notificationService.mentioned(user.id, mentionedUser.id, {
          id: post.id,
          username: post.user.username,
        });
      }
    }

    return post;
  }
}
