import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,DeleteDateColumn } from 'typeorm';

@Entity()
export class Group {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;
    @CreateDateColumn({ name: 'cdt', type: 'timestamp with time zone' })
    cdt: Date;
    @DeleteDateColumn({ name: 'ldt', type: 'timestamp with time zone' })
    ldt: Date; // soft deleted at
}
