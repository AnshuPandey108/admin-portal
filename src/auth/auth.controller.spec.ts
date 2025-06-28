import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      verifyOtp: jest.fn().mockResolvedValue({ success: true }),
      loginWithPassword: jest.fn().mockResolvedValue({ token: 'fake-jwt-token' }),
      generateJwt: jest.fn().mockResolvedValue({ token: 'refreshed-jwt' }),
      setPassword: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should verify OTP successfully', async () => {
    const result = await controller.verifyOtp('user@example.com', '123456');
    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('user@example.com', '123456');
    expect(result).toEqual({ success: true });
  });

  it('should login with email and password', async () => {
    const body = { email: 'user@example.com', password: 'secret' };
    const result = await controller.login(body);
    expect(mockAuthService.loginWithPassword).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(result).toEqual({ token: 'fake-jwt-token' });
  });

  it('should refresh token using current user', async () => {
    const req = { user: { id: '123', email: 'user@example.com' } };
    const result = await controller.refreshToken(req);
    expect(mockAuthService.generateJwt).toHaveBeenCalledWith(req.user);
    expect(result).toEqual({ token: 'refreshed-jwt' });
  });

  it('should set password with valid new password', async () => {
    const req = { user: { email: 'user@example.com' } };
    const result = await controller.setPassword(req, 'newpassword123');
    expect(mockAuthService.setPassword).toHaveBeenCalledWith('user@example.com', 'newpassword123');
    expect(result).toEqual({ success: true });
  });

  it('should throw error if password is too short', async () => {
    const req = { user: { email: 'user@example.com' } };
    await expect(controller.setPassword(req, '123')).rejects.toThrow(UnauthorizedException);
  });
});
