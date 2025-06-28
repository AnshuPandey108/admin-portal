import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  POWER_USER = 'power_user',
  USER = 'user',
  SUPPORT = 'support',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: false })
  isOtpVerified: boolean;

  @Column({ type: 'uuid', nullable: true })
  groupId: string;
}
