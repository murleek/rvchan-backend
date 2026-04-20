import {
  PublicUser,
  PublicUserSchema,
  ShortPublicUserSchema,
} from '../dto/user.dto';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toPublic(user: UserEntity): PublicUser {
    return PublicUserSchema.parse({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      description: user.description,
      isPrivate: user.isPrivate,
      state: user.state,
      avatarUrl: user.avatarUrl,
      followers: user.followers || 0,
      following: user.following || 0,
    });
  }

  static toShortPublic(user: UserEntity) {
    return ShortPublicUserSchema.parse({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    });
  }
}
