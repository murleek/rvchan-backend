import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';

import { UserState } from '../types/user.types';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ default: '' })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  password: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ default: true })
  isPrivate: boolean;

  @Column({ default: UserState.INIT })
  state: UserState;
}
