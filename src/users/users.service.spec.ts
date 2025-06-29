import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Otp } from '../auth/entities/otp.entity';
import { MailService } from '../mail/mail.service';
import { Repository, In } from 'typeorm';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';

describe('UsersService', () => {
    let service: UsersService;
    let userRepo: jest.Mocked<Repository<User>>;
    let otpRepo: jest.Mocked<Repository<Otp>>;
    let mailService: MailService;

    const fullUser = (overrides = {}): User => ({
        id: 'u1',
        email: 'test@example.com',
        password: '',
        role: UserRole.USER,
        groupId: 'g1',
        cdt: new Date(),
        ldt: new Date(), // 
        isOtpVerified: false,
        ...overrides,
    });

    const mockOtp = {
        id: 'otp-uuid',
        email: 'test@example.com',
        code: '123456',
        expiresAt: new Date(),
        createdAt: new Date(), // ✅ required
        cdt: new Date(),
        ldt: new Date(),
    };





    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Otp),
                    useValue: {
                        save: jest.fn(),
                    },
                },
                {
                    provide: MailService,
                    useValue: {
                        sendOtpLink: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        userRepo = module.get(getRepositoryToken(User));
        otpRepo = module.get(getRepositoryToken(Otp));
        mailService = module.get(MailService);
    });

    describe('create', () => {
        it('should create and save a user', async () => {
            const user = fullUser();
            userRepo.create.mockReturnValue(user);
            userRepo.save.mockResolvedValue(user);

            const result = await service.create(user);
            expect(result).toEqual(user);
            expect(userRepo.create).toHaveBeenCalledWith(user);
            expect(userRepo.save).toHaveBeenCalledWith(user);
        });
    });

    describe('findByEmail', () => {
        it('should find user by email', async () => {
            const user = fullUser();
            userRepo.findOne.mockResolvedValue(user);
            const result = await service.findByEmail(user.email);
            expect(result).toEqual(user);
        });
    });

    describe('createUserAndSendOtp', () => {
        it('should throw ConflictException if user exists', async () => {
            userRepo.findOne.mockResolvedValue(fullUser());
            await expect(
                service.createUserAndSendOtp('existing@example.com', UserRole.USER, 'g1', fullUser({ role: UserRole.ADMIN })),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException if SuperAdmin and no groupId', async () => {
            userRepo.findOne.mockResolvedValue(null);
            const superAdmin = fullUser({ role: UserRole.SUPER_ADMIN });
            await expect(
                service.createUserAndSendOtp('test@x.com', UserRole.USER, undefined, superAdmin),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw UnauthorizedException for invalid role by Admin', async () => {
            userRepo.findOne.mockResolvedValue(null);
            const admin = fullUser({ role: UserRole.ADMIN });
            await expect(
                service.createUserAndSendOtp('test@x.com', UserRole.SUPPORT, 'g1', admin),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for unallowed creator role', async () => {
            userRepo.findOne.mockResolvedValue(null);
            const powerUser = fullUser({ role: UserRole.POWER_USER });
            await expect(
                service.createUserAndSendOtp('test@x.com', UserRole.USER, 'g1', powerUser),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should create user, otp and send email successfully', async () => {
            userRepo.findOne.mockResolvedValue(null);
            userRepo.create.mockReturnValue(fullUser());
            userRepo.save.mockResolvedValue(fullUser());
            otpRepo.save.mockResolvedValue(mockOtp);
            const creator = fullUser({ role: UserRole.ADMIN });

            const result = await service.createUserAndSendOtp('new@x.com', UserRole.USER, 'g1', creator);

            expect(result.message).toContain('OTP link sent');
            expect(mailService.sendOtpLink).toHaveBeenCalled();
        });
    });

    describe('getVisibleUsers', () => {
        it('should allow SUPER_ADMIN to see all users', async () => {
            const user = fullUser({ role: UserRole.SUPER_ADMIN });
            userRepo.find.mockResolvedValue([user]);
            const result = await service.getVisibleUsers(user);
            expect(result).toHaveLength(1);
        });

        it('should allow ADMIN to see group users', async () => {
            const user = fullUser({ role: UserRole.ADMIN });
            userRepo.find.mockResolvedValue([user]);
            await service.getVisibleUsers(user);
            expect(userRepo.find).toHaveBeenCalled();
        });

        it('should allow POWER_USER to see users in their group', async () => {
            const user = fullUser({ role: UserRole.POWER_USER });
            userRepo.find.mockResolvedValue([user]);
            await service.getVisibleUsers(user);
            expect(userRepo.find).toHaveBeenCalled();
        });

        it('should throw ForbiddenException if USER tries to view', async () => {
            const user = fullUser({ role: UserRole.USER });
            await expect(service.getVisibleUsers(user)).rejects.toThrow(ForbiddenException);
        });
    });


    describe('deleteUserByRoleAware', () => {
        it('should throw NotFoundException if user not found', async () => {
            userRepo.findOne.mockResolvedValue(null);
            await expect(service.deleteUserByRoleAware('x', fullUser())).rejects.toThrow(NotFoundException);
        });

        it('should allow SUPER_ADMIN to delete', async () => {
            userRepo.findOne.mockResolvedValue(fullUser());
            const result = await service.deleteUserByRoleAware('x', fullUser({ role: UserRole.SUPER_ADMIN }));
            expect(result.message).toMatch(/deleted/);
        });

        it('should allow ADMIN to delete same group USER', async () => {
            userRepo.findOne.mockResolvedValue(fullUser({ role: UserRole.USER, groupId: 'g1' }));
            const result = await service.deleteUserByRoleAware('x', fullUser({ role: UserRole.ADMIN, groupId: 'g1' }));
            expect(result.message).toMatch(/deleted/);
        });

        it('should throw ForbiddenException for invalid delete case', async () => {
            userRepo.findOne.mockResolvedValue(fullUser({ role: UserRole.SUPPORT, groupId: 'g2' }));
            await expect(
                service.deleteUserByRoleAware('x', fullUser({ role: UserRole.ADMIN, groupId: 'g1' })),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getOneVisibleUser', () => {
        it('should return user if SUPER_ADMIN', async () => {
            userRepo.findOne.mockResolvedValue(fullUser({ id: 'target' }));
            const result = await service.getOneVisibleUser('target', fullUser({ role: UserRole.SUPER_ADMIN }));
            expect(result.id).toBe('target');
        });

        it('should return user if ADMIN in same group', async () => {
            userRepo.findOne.mockResolvedValue(fullUser({ role: UserRole.USER, groupId: 'g1' }));
            const result = await service.getOneVisibleUser('target', fullUser({ role: UserRole.ADMIN, groupId: 'g1' }));
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException if not found', async () => {
            userRepo.findOne.mockResolvedValue(null);
            await expect(service.getOneVisibleUser('x', fullUser())).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException for unsupported view case', async () => {
            userRepo.findOne.mockResolvedValue(fullUser({ role: UserRole.ADMIN, groupId: 'g2' }));
            await expect(service.getOneVisibleUser('x', fullUser({ role: UserRole.POWER_USER, groupId: 'g1' }))).rejects.toThrow(ForbiddenException);
        });
    });
});