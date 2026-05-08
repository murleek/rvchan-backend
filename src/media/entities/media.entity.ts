import { UserEntity } from 'src/user/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MediaEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // @Column({ default: false })
  // uploaded: boolean = false;

  @Column()
  url!: string;

  @Column()
  hash!: string;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column()
  path!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user!: UserEntity;
}
