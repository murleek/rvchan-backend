import { first } from 'rxjs';
import { PublicUser, PublicUserSchema } from '../dto/user.dto';
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
    });
  }
}
