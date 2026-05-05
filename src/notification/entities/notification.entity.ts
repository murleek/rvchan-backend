import { UserEntity } from 'src/user/entities/user.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  BaseEntity,
  Entity,
  JoinColumn,
} from 'typeorm';
import { NotificationType } from '../types/notification.types';

@Entity()
@Index(['groupKey', 'isRead'])
export class NotificationEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor?: UserEntity;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ nullable: true })
  groupKey!: string;

  @Column({ type: 'int', default: 1 })
  count!: number;

  @Column({ type: 'jsonb', default: [] })
  actors: number[] = [];

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, any>;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
