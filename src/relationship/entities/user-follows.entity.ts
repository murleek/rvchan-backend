import { UserEntity } from 'src/user/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['follower', 'following'])
@Index(['follower'])
@Index(['following'])
export class UserFollowsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.following)
  follower: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.followers)
  following: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
