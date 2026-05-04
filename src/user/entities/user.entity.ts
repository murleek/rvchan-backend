import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
  CreateDateColumn,
} from 'typeorm';

import { UserState } from '../types/user.types';
import { UserFollowsEntity } from 'src/relationship/entities/user-follows.entity';

@Index('user_search_vector_idx', { synchronize: false })
@Index('user_username_trgm_idx', { synchronize: false })
@Index('user_firstname_trgm_idx', { synchronize: false })
@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ default: '' })
  firstName!: string;

  @Column({ nullable: true })
  lastName!: string;

  @Column({ nullable: true })
  description!: string;

  @Column()
  password!: string;

  @Column({ unique: true, nullable: true })
  username!: string;

  @Column({ default: true })
  isPrivate!: boolean;

  @Column({ type: 'enum', enum: UserState, default: UserState.INIT })
  state!: UserState;

  @OneToMany(() => UserFollowsEntity, (rel) => rel.follower)
  following!: UserFollowsEntity[];

  @OneToMany(() => UserFollowsEntity, (rel) => rel.following)
  followers!: UserFollowsEntity[];

  @Column({ type: 'tsvector', select: false, nullable: true })
  search_vector?: string;

  @Column({ nullable: true })
  avatarUrl!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  lastActiveAt!: Date;
}
