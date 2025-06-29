import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,DeleteDateColumn } from 'typeorm';

@Entity()
export class Otp {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column()
    code: string;

    @Column()
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;
    @CreateDateColumn({ name: 'cdt', type: 'timestamp with time zone' })
    cdt: Date;
    @DeleteDateColumn({ name: 'ldt', type: 'timestamp with time zone' })
    ldt: Date; // soft deleted at
}
