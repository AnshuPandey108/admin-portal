import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/create-transaction.dto';
import { UserRole } from '../users/entities/user.entity';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: UserRole.USER,
    groupId: 'group-1',
  };

  const mockTransaction = {
    id: 'txn-1',
    content: 'Sample Transaction',
    userId: 'user-1',
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockTransaction),
    getAllForUser: jest.fn().mockResolvedValue([mockTransaction]),
    deleteTransaction: jest.fn().mockResolvedValue({ success: true }),
    getOneById: jest.fn().mockResolvedValue(mockTransaction),
    updateTransaction: jest.fn().mockResolvedValue({ ...mockTransaction, content: 'Updated' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a transaction', async () => {
    const dto: CreateTransactionDto = { title: 'Hello World' };
    const result = await controller.create(dto, { user: mockUser });

    expect(service.create).toHaveBeenCalledWith(dto, mockUser);
    expect(result).toEqual(mockTransaction);
  });

  it('should return all transactions for a user', async () => {
    const result = await controller.findAll({ user: mockUser });

    expect(service.getAllForUser).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual([mockTransaction]);
  });

  it('should return a single transaction by id', async () => {
    const result = await controller.findOne('txn-1', { user: mockUser });

    expect(service.getOneById).toHaveBeenCalledWith('txn-1', mockUser);
    expect(result).toEqual(mockTransaction);
  });

  it('should update a transaction', async () => {
    const dto: UpdateTransactionDto = { title: 'Hello World' };
    const result = await controller.update('txn-1', dto, { user: mockUser });

    expect(service.updateTransaction).toHaveBeenCalledWith('txn-1', dto, mockUser);
    expect(result.title).toBe('Updated');
  });

  it('should delete a transaction', async () => {
    const result = await controller.delete('txn-1', { user: mockUser });

    expect(service.deleteTransaction).toHaveBeenCalledWith('txn-1', mockUser);
    expect(result).toEqual({ success: true });
  });
});
