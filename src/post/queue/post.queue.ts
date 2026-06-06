import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { PostEntity } from '../entities/post.entity';
import { ICurrentUser } from 'src/user/types/user.types';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { PostService } from '../post.service';
import { UserService } from 'src/user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('posting')
@Injectable()
export class PostingProcessor extends WorkerHost {
  constructor(
    @InjectRepository(PostEntity)
    private postRepo: TreeRepository<PostEntity>,
    private readonly postService: PostService,
    private readonly userService: UserService,
    private gateway: WebsocketGateway,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(
    job: Job<{ postData: Partial<PostEntity>; user: ICurrentUser }>,
  ) {
    const { postData, user } = job.data;
    const entities = this.postService.createEntities(postData.content || '');
    let parent: PostEntity | undefined = undefined;

    if (postData.parentId) {
      const parentPost = await this.postRepo.findOne({
        where: { id: postData.parentId },
        relations: ['user'],
      });

      if (!parentPost) {
        throw new Error('Parent post not found');
      }

      parent = parentPost;
    }

    const postSave = await this.postRepo.save({
      ...postData,
      type: postData.parentId ? 'reply' : 'thread',
      entities,
      parent,
      user,
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

    const parents = this.postService
      .sortByHierarchy(
        await this.postRepo.findAncestors(post, {
          relations: ['user'],
        }),
      )
      .reverse();
    if (parents.length > 1) {
      const ancestorPosts = parents.slice(1);

      await Promise.all(
        ancestorPosts.map((ancestor) =>
          this.postRepo.increment({ id: ancestor.id }, 'replyCount', 1),
        ),
      );

      parentPost = parents[1];
    }

    const publicPost = await this.postService.getPublicPost(post, user);

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
      if (mentionedUser && mentionedUser.id !== user.id) {
        this.eventEmitter.emit('post.mentioned', {
          targetId: mentionedUser.id,
          actorId: user.id,
          payload: { postId: post.id, username: post.user.username },
        });
      }
    }

    for (let i = 0; i < parents.length; i++) {
      const ancestor = parents[i];
      const sended = new Set<number>();

      if (
        ancestor.id !== post.id &&
        ancestor.user.id !== user.id &&
        !sended.has(ancestor.user.id)
      ) {
        if (ancestor.id === post.parentId) {
          this.eventEmitter.emit('post.replied', {
            targetId: ancestor.user.id,
            actorId: user.id,
            payload: { postId: post.id, username: post.user.username },
          });
        } else {
          this.eventEmitter.emit('post.replied_to_other', {
            targetId: ancestor.user.id,
            actorId: user.id,
            payload: { postId: post.id, username: post.user.username },
          });
        }
        sended.add(ancestor.user.id);
      }
    }

    return post;
  }
}
