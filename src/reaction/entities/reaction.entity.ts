import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Column,
} from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { PostEntity } from 'src/post/entities/post.entity';

@Entity()
@Unique(['userId', 'postId'])
export class ReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @Column()
  reaction!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post!: PostEntity;

  @CreateDateColumn()
  createdAt!: Date;
}
