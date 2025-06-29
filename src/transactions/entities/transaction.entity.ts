// src/transactions/entities/transaction.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn,DeleteDateColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'uuid', nullable: true })
    groupId: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
    @CreateDateColumn({ name: 'cdt', type: 'timestamp with time zone' })
    cdt: Date;
    @DeleteDateColumn({ name: 'ldt', type: 'timestamp with time zone' })
    ldt: Date; // soft deleted at


}
