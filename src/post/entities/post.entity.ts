import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Tree,
  TreeParent,
  TreeChildren,
  BaseEntity,
} from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { ReactionEntity } from 'src/reaction/entities/reaction.entity';
import { TextEntity } from '../types/post.types';

@Entity()
@Tree('closure-table')
export class PostEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column()
  userId!: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ default: 'thread' })
  type!: 'thread' | 'reply';

  @Column({ nullable: true })
  parentId?: number;

  @TreeParent({ onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent?: PostEntity;

  @TreeChildren()
  replies!: PostEntity[];

  @OneToMany(() => ReactionEntity, (reaction) => reaction.post)
  reactions!: ReactionEntity[];

  // Метаданные для тредов
  @Column({ default: 0 })
  replyCount!: number;

  @Column({ default: 0 })
  likeCount!: number;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  entities?: TextEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
