import { Command, CommandRunner, Option } from 'nest-commander';
import { NotificationService } from '../notification.service';
import { UserService } from 'src/user/user.service';

interface NotifyAllCommandOptions {
  title: string;
  subtitle?: string;
  url?: string;
  verbose?: boolean;
}

@Command({
  name: 'notify:all',
  description: 'Send service notifications to all users',
})
export class NotifyAllCommand extends CommandRunner {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {
    super();
  }

  async run(
    passedParam: string[],
    options: NotifyAllCommandOptions,
  ): Promise<void> {
    if (!options.title) {
      console.error('Error: Title is required');
      return;
    }

    const payload = {
      title: options.title,
      subtitle: options.subtitle,
      url: options.url,
    };

    const users = await this.userService.findAll();
    for (const user of users) {
      await this.notificationService.serviceMessage(user.id, payload);
    }
  }

  @Option({
    flags: '-t, --title <title>',
    description: 'Title of the notification',
  })
  parseTitle(val: string): string {
    return val;
  }

  @Option({
    flags: '-s, --subtitle [subtitle]',
    description: 'Subtitle of the notification',
  })
  parseSubtitle(val: string): string {
    return val;
  }

  @Option({
    flags: '-u, --url [url]',
    description: 'URL of the notification',
  })
  parseUrl(val: string): string {
    return val;
  }

  @Option({
    flags: '-v, --verbose',
    description: 'Enable verbose output',
  })
  parseVerbose(val: boolean): boolean {
    return val;
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
