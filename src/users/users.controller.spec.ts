import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    createUserAndSendOtp: jest.fn(),
    getVisibleUsers: jest.fn(),
    deleteUserByRoleAware: jest.fn(),
    getOneVisibleUser: jest.fn(),
  };

  const mockUser = {
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    groupId: 'g1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create user and send OTP', async () => {
    const body = { email: 'newuser@example.com', role: UserRole.USER, groupId: 'g1' };
    mockUsersService.createUserAndSendOtp.mockResolvedValue({ message: 'OTP sent' });

    const result = await controller.createUser({ user: mockUser }, body);

    expect(service.createUserAndSendOtp).toHaveBeenCalledWith(
      body.email,
      body.role,
      body.groupId,
      mockUser
    );
    expect(result).toEqual({ message: 'OTP sent' });
  });

  it('should get visible users', async () => {
    const mockUsers = [{ id: 'u1', email: 'a@example.com' }];
    mockUsersService.getVisibleUsers.mockResolvedValue(mockUsers);

    const result = await controller.getUsers({ user: mockUser });

    expect(service.getVisibleUsers).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockUsers);
  });

  it('should delete user by role-aware method', async () => {
    const id = 'user-id';
    mockUsersService.deleteUserByRoleAware.mockResolvedValue({ message: 'User deleted' });

    const result = await controller.deleteUser({ user: mockUser }, id);

    expect(service.deleteUserByRoleAware).toHaveBeenCalledWith(id, mockUser);
    expect(result).toEqual({ message: 'User deleted' });
  });

  it('should return one user by id', async () => {
    const id = 'user-id';
    const mockUserData = { id, email: 'found@example.com' };
    mockUsersService.getOneVisibleUser.mockResolvedValue(mockUserData);

    const result = await controller.getOneUser(id, { user: mockUser });

    expect(service.getOneVisibleUser).toHaveBeenCalledWith(id, mockUser);
    expect(result).toEqual(mockUserData);
  });
});
