import { Command, CommandRunner } from 'nest-commander';
import { TreeRepository } from 'typeorm';
import { PostEntity } from '../entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PostService } from '../post.service';

@Command({
  name: 'post:recalc-replies',
  description: 'Recalculate reply counts for posts',
})
export class RecalculateRepliesCommand extends CommandRunner {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: TreeRepository<PostEntity>,
    private readonly postService: PostService,
  ) {
    super();
  }

  async run(): Promise<void> {
    const posts = await this.postRepo.findTrees();

    for (const post of posts) {
      const replyCount = await this.postService.countReplies(post.id);
      await this.postRepo.update(post.id, { replyCount });
    }
  }
}

// import { Command, CommandRunner, Option } from 'nest-commander';
// import { Injectable } from '@nestjs/common';
// import { UsersService } from '../users/users.service';

// interface SeedOptions {
//   count?: number;
// }

// @Injectable()
// @Command({ name: 'seed-users', description: 'Создаёт тестовых пользователей' })
// export class SeedUsersCommand extends CommandRunner {
//   constructor(private readonly usersService: UsersService) {
//     super();
//   }

//   async run(passedParams: string[], options: SeedOptions): Promise<void> {
//     const count = options.count ?? 10;

//     for (let i = 0; i < count; i++) {
//       await this.usersService.create({
//         name: `User ${i}`,
//         email: `user${i}@example.com`,
//       });
//     }

//     console.log(`Создано ${count} пользователей`);
//   }

//   @Option({
//     flags: '-c, --count [count]',
//     description: 'Количество пользователей',
//   })
//   parseCount(val: string): number {
//     return Number(val);
//   }
// }
