// src/transactions/transactions.service.ts
import { Injectable, ForbiddenException,NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private readonly txRepo: Repository<Transaction>,
    ) { }

    async create(dto: CreateTransactionDto, user: User) {
        if (user.role !== UserRole.USER) {
            throw new ForbiddenException('Only users can create transactions');
        }

        const tx = this.txRepo.create({
            title: dto.title,
            userId: user.id,
            groupId: user.groupId,
        });

        return await this.txRepo.save(tx);
    }

    async getAllForUser(user: User): Promise<Transaction[]> {
        const qb = this.txRepo.createQueryBuilder('tx').leftJoinAndSelect('tx.user', 'user');

        if (user.role === UserRole.USER) {
            qb.where('tx.userId = :userId', { userId: user.id });
        } else if (user.role === UserRole.POWER_USER) {
            qb.where('tx.groupId = :groupId', { groupId: user.groupId });
        } else if (user.role === UserRole.ADMIN) {
            qb.where('tx.groupId = :groupId', { groupId: user.groupId });
        } else if ([UserRole.SUPPORT, UserRole.SUPER_ADMIN].includes(user.role)) {
            // No filter — see all
        } else {
            throw new ForbiddenException('You are not allowed to view transactions');
        }

        return await qb.orderBy('tx.createdAt', 'DESC').getMany();
    }

    async deleteTransaction(id: string, user: User): Promise<{ message: string }> {
        const tx = await this.txRepo.findOne({ where: { id } });
        if (!tx) throw new NotFoundException('Transaction not found');

        if (user.role === UserRole.SUPER_ADMIN) {
            await this.txRepo.delete(id);
            return { message: 'Transaction deleted' };
        }

        if (user.role === UserRole.ADMIN) {
            if (tx.groupId === user.groupId) {
                await this.txRepo.delete(id);
                return { message: 'Transaction deleted by Admin' };
            } else {
                throw new ForbiddenException('Not allowed to delete transaction from another group');
            }
        }

        if (user.role === UserRole.USER && tx.userId === user.id) {
            await this.txRepo.delete(id);
            return { message: 'Transaction deleted by User' };
        }

        throw new ForbiddenException('You are not allowed to delete this transaction');
    }


}
