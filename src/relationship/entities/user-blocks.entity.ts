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
@Unique(['blocker', 'blocked'])
@Index(['blocker'])
@Index(['blocked'])
export class UserBlocksEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity)
  blocker: UserEntity;

  @ManyToOne(() => UserEntity)
  blocked: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
