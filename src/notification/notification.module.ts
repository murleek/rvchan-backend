import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { NotificationEntity } from './entities/notification.entity';
import { NotificationListener } from './listeners/notification.listener';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { NotificationController } from './notification.controller';
import { SessionsModule } from 'src/sessions/sessions.module';
import { MediaModule } from 'src/media/media.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    forwardRef(() => WebsocketModule),
    forwardRef(() => SessionsModule),
    forwardRef(() => UserModule),
    MediaModule,
    PaginationModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationProcessor, NotificationListener],
  exports: [NotificationService],
})
export class NotificationModule {}
