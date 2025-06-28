import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { User } from '../users/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let userRepo: Repository<User>;
    let otpRepo: Repository<Otp>;
    let jwtService: JwtService;

    const mockUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: '$2b$10$hashedpassword',
        role: 'user',
        groupId: 'group-1',
    };

    const mockOtp = {
        email: 'test@example.com',
        code: '123456',
        expiresAt: new Date(Date.now() + 60000),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User), useValue: {
                        findOne: jest.fn(),
                        update: jest.fn(),
                    }
                },
                {
                    provide: getRepositoryToken(Otp), useValue: {
                        findOne: jest.fn(),
                        delete: jest.fn(),
                    }
                },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepo = module.get(getRepositoryToken(User));
        otpRepo = module.get(getRepositoryToken(Otp));
        jwtService = module.get(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('verifyOtp', () => {
        it('should verify OTP and return JWT token', async () => {
            jest.spyOn(otpRepo, 'findOne').mockResolvedValueOnce(mockOtp as Otp);
            jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser as User);

            const result = await service.verifyOtp('test@example.com', '123456');

            expect(result.token).toBe('mocked-jwt-token');
            expect(otpRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com', code: '123456' } });
            expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        });

        it('should throw error for expired OTP', async () => {
            const expiredOtp = { ...mockOtp, expiresAt: new Date(Date.now() - 60000) };
            jest.spyOn(otpRepo, 'findOne').mockResolvedValueOnce(expiredOtp as Otp);

            await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw error if user not found', async () => {
            jest.spyOn(otpRepo, 'findOne').mockResolvedValueOnce(mockOtp as Otp);
            jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(null);

            await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('setPassword', () => {
        it('should hash and update password, delete OTP', async () => {
            const hashSpy = jest.spyOn(bcrypt, 'hash') as jest.Mock;
            hashSpy.mockResolvedValueOnce('hashedpass');



            await service.setPassword('test@example.com', 'newpassword123');

            expect(hashSpy).toHaveBeenCalledWith('newpassword123', 10);
            expect(userRepo.update).toHaveBeenCalledWith(
                { email: 'test@example.com' },
                { password: 'hashedpass', isOtpVerified: true }
            );
            expect(otpRepo.delete).toHaveBeenCalledWith({ email: 'test@example.com' });
        });
    });

    describe('loginWithPassword', () => {
        it('should login and return JWT token', async () => {
            const compareSpy = jest.spyOn(bcrypt, 'compare') as jest.Mock;
            compareSpy.mockResolvedValueOnce(true);

            jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser as User);

            const result = await service.loginWithPassword('test@example.com', 'plainpass');

            expect(compareSpy).toHaveBeenCalledWith('plainpass', mockUser.password);
            expect(result.token).toBe('mocked-jwt-token');
        });

        it('should throw error if user not found', async () => {
            jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(null);

            await expect(service.loginWithPassword('notfound@example.com', 'pass')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw error if password does not match', async () => {
            jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser as User);
            (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValueOnce(false);


            await expect(service.loginWithPassword('test@example.com', 'wrongpass')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('generateJwt', () => {
        it('should return token and user', async () => {
            const result = await service.generateJwt(mockUser);

            expect(result.token).toBe('mocked-jwt-token');
            expect(result.user).toBe(mockUser);
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
                groupId: mockUser.groupId,
            }, { expiresIn: '1h' });
        });
    });
});
