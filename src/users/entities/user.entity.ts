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
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ nullable: true })
  groupId: number; // for Admin/Power User/User grouping
}
