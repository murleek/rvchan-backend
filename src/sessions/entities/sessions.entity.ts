import { UserEntity } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class SessionsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ generated: 'increment', unique: true })
  internalId!: number;

  @Column()
  tokenHash!: string;

  @Column()
  expiresAt!: Date;

  @Column({ default: 'unknown' })
  ip!: string;

  @Column({ default: 'unknown' })
  userAgent!: string;

  @Column({ nullable: true })
  browser!: string;

  @Column({ nullable: true })
  browserVersion!: string;

  @Column({ nullable: true })
  deviceModel!: string;

  @Column({ nullable: true })
  deviceType!: string;

  @Column({ nullable: true })
  deviceVendor!: string;

  @Column({ nullable: true })
  os!: string;

  @Column({ nullable: true })
  osVersion!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'uuid', generated: 'uuid' })
  deviceId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user!: UserEntity;
}
