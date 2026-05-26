import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { ParsedUserAgent } from 'src/common/interfaces/user-agent.interface';

@Injectable()
export class NotificationListener {
  constructor(private service: NotificationService) {}

  @OnEvent('user.followed')
  handleFollow(data: { actorId: string; targetId: string }) {
    return this.service.follow(data.actorId, data.targetId);
  }

  @OnEvent('user.follow.accepted')
  handleAccepted(data: { actorId: string; targetId: string }) {
    return this.service.followAccepted(data.actorId, data.targetId);
  }

  @OnEvent('session.new_device')
  handleDevice(data: {
    userId: number;
    device: ParsedUserAgent;
    deviceId: string;
    ip: string;
  }) {
    return this.service.newDevice(
      data.userId,
      { ...data.device, deviceId: data.deviceId },
      data.ip,
    );
  }

  @OnEvent('post.mentioned')
  handleMention(data: {
    actorId: number;
    targetId: number;
    payload: { postId: number; username: string };
  }) {
    return this.service.mentioned(data.actorId, data.targetId, data.payload);
  }

  @OnEvent('post.replied')
  handleReply(data: {
    actorId: number;
    targetId: number;
    payload: { postId: number; username: string };
  }) {
    return this.service.replied(data.actorId, data.targetId, data.payload);
  }

  @OnEvent('post.replied_to_other')
  handleReplyToOther(data: {
    actorId: number;
    targetId: number;
    payload: { postId: number; username: string };
  }) {
    return this.service.repliedToOther(
      data.actorId,
      data.targetId,
      data.payload,
    );
  }
}
