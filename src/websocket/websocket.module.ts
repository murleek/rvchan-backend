import { forwardRef, Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { SessionsModule } from 'src/sessions/sessions.module';
import { NotificationModule } from 'src/notification/notification.module';
import { UserModule } from 'src/user/user.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  providers: [WebsocketGateway],
  imports: [
    forwardRef(() => SessionsModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => UserModule),
    RedisModule,
  ],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
