import { is } from 'zod/v4/locales';
import {
  PostSchema,
  ThreadSchema,
  PublicPost,
  PublicThread,
} from '../dto/post.dto';
import { PostEntity } from '../entities/post.entity';

export class PostMapper {
  static toPublicPost(post: PostEntity): PublicPost {
    return PostSchema.parse({
      id: post.id,
      user: post.user,
      parent: post.parent,
      content: post.content,
      replyCount: post.replyCount,
      likeCount: post.likeCount,
      createdAt: post.createdAt,
      entities: post.entities,
      isLiked: false,
    });
  }
  static toPublicThread(post: PostEntity): PublicThread {
    return ThreadSchema.parse({
      id: post.id,
      user: post.user,
      content: post.content,
      replyCount: post.replyCount,
      likeCount: post.likeCount,
      createdAt: post.createdAt,
      entities: post.entities,
      parent: post.parent ? this.toPublicThread(post.parent) : null,
      replies: post.replies,
      isLiked: false,
    });
  }
}
