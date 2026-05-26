import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from 'src/auth/guards/ws-jwt.guard';
import { JwtAccessPayload } from 'src/auth/types/jwt.types';
import { NotificationEntity } from 'src/notification/entities/notification.entity';
import { NotificationService } from 'src/notification/notification.service';
import { PublicPost } from 'src/post/dto/post.dto';
import { ONLINE_KEY } from 'src/redis/redis.keys';
import { RedisService } from 'src/redis/redis.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { UserEntity } from 'src/user/entities/user.entity';
import { ICurrentUser } from 'src/user/types/user.types';
import { UserService } from 'src/user/user.service';

const USER_CHANNEL = (userId: number | string) => `user:${userId}`;
const ONLINE_TTL = 60;

@WebSocketGateway({ namespace: 'ws' })
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token: string = client.handshake.auth?.token;
      const payload: JwtAccessPayload =
        await this.sessionsService.verify(token);

      const userId = payload.sub;

      client.data.user = {
        id: userId,
        deviceId: payload.deviceId,
      };

      await client.join(USER_CHANNEL(userId));

      const connections = await this.redisService.incr(ONLINE_KEY(userId));
      await this.redisService.expire(ONLINE_KEY(userId), 300);

      if (connections === 1) {
        await this.userService.updateLastActive(userId);
      }

      client.emit('connected', { userId });

      const unseen = await this.notificationService.countUnseenNotifications(
        userId,
        payload.deviceId,
      );

      // Отправляем счётчик только этому сокету (конкретному девайсу)
      this.sendToSocket(client.id, 'notification:counters', { unseen });
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user: UserEntity | null = client.data.user;
    if (!user) return;

    const userId = user.id;

    const connections = await this.redisService.decr(ONLINE_KEY(userId));

    if (connections <= 0) {
      await this.redisService.del(ONLINE_KEY(userId));
      await this.userService.updateLastActive(userId);
    }
  }

  sendToUser(userId: number, event: string, data: any) {
    this.server.to(USER_CHANNEL(userId)).emit(event, data);
  }

  sendToSocket(socketId: string, event: string, counters: any) {
    this.server.to(socketId).emit(event, counters);
  }

  // Broadcast счётчика всем сокетам юзера
  async updateCounters(userId: number) {
    const sockets = await this.server.in(USER_CHANNEL(userId)).fetchSockets();

    for (const socket of sockets) {
      const deviceId: string = socket.data.user?.deviceId;
      if (!deviceId) continue;

      const unseen = await this.notificationService.countUnseenNotifications(
        userId,
        deviceId,
      );

      socket.emit('notification:counters', { unseen });
    }
  }

  async notifyNew({ notification }: { notification: NotificationEntity }) {
    try {
      const userId = notification.recipient.id;

      const sockets = await this.server.in(USER_CHANNEL(userId)).fetchSockets();

      for (const socket of sockets) {
        const deviceId: string = socket.data.user?.deviceId;
        if (!deviceId) continue;

        const deviceUnseen =
          await this.notificationService.countUnseenNotifications(
            userId,
            deviceId,
          );

        socket.emit('notification:new', {
          notification:
            await this.notificationService.getPublicNotification(notification),
          unseen: deviceUnseen,
        });
      }
    } catch (e) {
      console.log('Failed to send notification', e);
    }
  }

  postCreated(
    post: PublicPost & { parent?: { id: number; username: string } },
    user: ICurrentUser,
    jobId?: string,
  ) {
    // const sockets = await this.server.in(USER_CHANNEL(user.id)).fetchSockets();

    // for (const socket of sockets) {
    //   this.sendToSocket(socket.id, 'post:created', {
    //     id: post.id,
    //     content: post.content,
    //     parentId: post.parentId,
    //     imageUrl: post.imageUrl,
    //     createdAt: post.createdAt,
    //   });
    // }

    this.sendToUser(user.id, 'post:created', { post, jobId });
  }

  async notifyUpdate(notification: NotificationEntity) {
    this.sendToUser(
      notification.recipient.id,
      'notification:update',
      await this.notificationService.getPublicNotification(notification),
    );
  }

  notifyDelete(notificationId: string, userId: number) {
    this.sendToUser(userId, 'notification:delete', {
      id: notificationId,
    });
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('notification:seen')
  async handleSeen(@ConnectedSocket() client: Socket) {
    const { id: userId, deviceId }: { id: number; deviceId: string } =
      client.data.user;

    await this.notificationService.markAllAsSeen(userId, deviceId);

    // Сбрасываем только этому девайсу
    this.sendToSocket(client.id, 'notification:counters', { unseen: 0 });

    return { ok: true };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('user:get')
  getUser(@ConnectedSocket() client: Socket) {
    const user = client.data.user;

    return { user };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('ping')
  async handlePing(
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string }> {
    const { id: userId, deviceId }: { id: number; deviceId: string } =
      client.data.user;

    await this.userService.updateLastActive(userId);
    await this.redisService.expire(ONLINE_KEY(userId), ONLINE_TTL);

    // Обновляем счётчик для конкретного девайса
    const unseen = await this.notificationService.countUnseenNotifications(
      userId,
      deviceId,
    );
    this.sendToSocket(client.id, 'notification:counters', { unseen });

    return { event: 'pong' };
  }
}
