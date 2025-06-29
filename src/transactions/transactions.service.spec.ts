import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/create-transaction.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: jest.Mocked<Repository<Transaction>>;

  const mockTx = { id: 'tx1', title: 'Test', userId: 'u1', groupId: 'g1', cdt: new Date() , ldt: new Date() } as Transaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repo = module.get(getRepositoryToken(Transaction));
  });

  describe('create', () => {
    it('should create transaction for user', async () => {
      const user: User = { id: 'u1', role: UserRole.USER, groupId: 'g1' } as User;
      const dto: CreateTransactionDto = { title: 'Test' };

      repo.create.mockReturnValue({ ...dto, userId: user.id, groupId: user.groupId } as Transaction);
      repo.save.mockResolvedValue(mockTx);

      const result = await service.create(dto, user);
      expect(result).toEqual(mockTx);
    });

    it('should throw if non-user tries to create', async () => {
      const user: User = { id: 'u1', role: UserRole.ADMIN } as User;
      await expect(service.create({ title: 'Invalid' }, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAllForUser', () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockTx]),
    };

    beforeEach(() => {
      repo.createQueryBuilder.mockReturnValue(qb as any);
    });

    it('should get transactions for USER', async () => {
      const user: User = { id: 'u1', role: UserRole.USER, groupId: 'g1' } as User;
      const result = await service.getAllForUser(user);
      expect(result).toEqual([mockTx]);
      expect(qb.where).toHaveBeenCalledWith('tx.userId = :userId', { userId: 'u1' });
    });

    it('should get transactions for POWER_USER', async () => {
      const user: User = { id: 'u2', role: UserRole.POWER_USER, groupId: 'g1' } as User;
      await service.getAllForUser(user);
      expect(qb.where).toHaveBeenCalledWith('tx.groupId = :groupId', { groupId: 'g1' });
    });

    it('should get transactions for ADMIN', async () => {
      const user: User = { id: 'u3', role: UserRole.ADMIN, groupId: 'g1' } as User;
      await service.getAllForUser(user);
      expect(qb.where).toHaveBeenCalledWith('tx.groupId = :groupId', { groupId: 'g1' });
    });

    it('should get all for SUPER_ADMIN or SUPPORT', async () => {
      const user: User = { id: 'u4', role: UserRole.SUPER_ADMIN } as User;
      await service.getAllForUser(user);
      expect(qb.where).not.toHaveBeenCalled();
    });

    it('should throw for unknown role', async () => {
      const user: any = { role: 'invalid' };
      await expect(service.getAllForUser(user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteTransaction', () => {
    it('SUPER_ADMIN can delete', async () => {
      repo.findOne.mockResolvedValue(mockTx);
      const user = { role: UserRole.SUPER_ADMIN } as User;
      await expect(service.deleteTransaction('tx1', user)).resolves.toEqual({ message: 'Transaction deleted' });
    });

    it('ADMIN can delete own group transaction', async () => {
      repo.findOne.mockResolvedValue(mockTx);
      const user = { role: UserRole.ADMIN, groupId: 'g1' } as User;
      await expect(service.deleteTransaction('tx1', user)).resolves.toEqual({ message: 'Transaction deleted by Admin' });
    });

    it('ADMIN cannot delete other group transaction', async () => {
      repo.findOne.mockResolvedValue({ ...mockTx, groupId: 'g2' });
      const user = { role: UserRole.ADMIN, groupId: 'g1' } as User;
      await expect(service.deleteTransaction('tx1', user)).rejects.toThrow(ForbiddenException);
    });

    it('USER can delete their own transaction', async () => {
      repo.findOne.mockResolvedValue(mockTx);
      const user = { role: UserRole.USER, id: 'u1' } as User;
      await expect(service.deleteTransaction('tx1', user)).resolves.toEqual({ message: 'Transaction deleted by User' });
    });

    it('USER cannot delete others\' transactions', async () => {
      repo.findOne.mockResolvedValue({ ...mockTx, userId: 'u2' });
      const user = { role: UserRole.USER, id: 'u1' } as User;
      await expect(service.deleteTransaction('tx1', user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw if transaction not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.deleteTransaction('fake-id', {} as User)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOneById', () => {
    it('SUPER_ADMIN can view', async () => {
      repo.findOne.mockResolvedValue(mockTx);
      const user = { role: UserRole.SUPER_ADMIN } as User;
      const result = await service.getOneById('tx1', user);
      expect(result).toEqual(mockTx);
    });

    it('ADMIN can view own group', async () => {
      repo.findOne.mockResolvedValue(mockTx);
      const user = { role: UserRole.ADMIN, groupId: 'g1' } as User;
      const result = await service.getOneById('tx1', user);
      expect(result).toEqual(mockTx);
    });

    it('ADMIN cannot view other group', async () => {
      repo.findOne.mockResolvedValue({ ...mockTx, groupId: 'g2' });
      const user = { role: UserRole.ADMIN, groupId: 'g1' } as User;
      await expect(service.getOneById('tx1', user)).rejects.toThrow(ForbiddenException);
    });

    it('USER can view their own tx', async () => {
      repo.findOne.mockResolvedValue(mockTx);
      const user = { role: UserRole.USER, id: 'u1' } as User;
      const result = await service.getOneById('tx1', user);
      expect(result).toEqual(mockTx);
    });

    it('USER cannot view others tx', async () => {
      repo.findOne.mockResolvedValue({ ...mockTx, userId: 'other' });
      const user = { role: UserRole.USER, id: 'u1' } as User;
      await expect(service.getOneById('tx1', user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw if transaction not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getOneById('nope', {} as User)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTransaction', () => {
    it('should update if USER owns tx', async () => {
      repo.findOne.mockResolvedValue(mockTx);
      repo.save.mockResolvedValue({ ...mockTx, title: 'Updated' });
      const user = { role: UserRole.USER, id: 'u1' } as User;

      const result = await service.updateTransaction('tx1', { title: 'Updated' }, user);
      expect(result.title).toBe('Updated');
    });

    it('should throw if USER does not own tx', async () => {
      repo.findOne.mockResolvedValue({ ...mockTx, userId: 'other' });
      const user = { role: UserRole.USER, id: 'u1' } as User;
      await expect(service.updateTransaction('tx1', { title: 'New' }, user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw if non-USER tries to update', async () => {
      repo.findOne.mockResolvedValue(mockTx);
      const user = { role: UserRole.ADMIN, id: 'u1' } as User;
      await expect(service.updateTransaction('tx1', { title: 'New' }, user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw if transaction not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const user = { role: UserRole.USER, id: 'u1' } as User;
      await expect(service.updateTransaction('tx999', { title: 'x' }, user)).rejects.toThrow(NotFoundException);
    });
  });
});
