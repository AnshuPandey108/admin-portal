import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Otp)
        private otpRepo: Repository<Otp>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private jwtService: JwtService,
    ) { }
/*-------------------------------Verify Otp--------------------------------*/
    async verifyOtp(email: string, code: string): Promise<{ token: string }> {
        console.log('Verifying OTP for email:', email, 'with code:', code);
        const otp = await this.otpRepo.findOne({ where: { email, code } });
        console.log('Found OTP:', otp);
        if (!otp || new Date() > otp.expiresAt) {
            throw new UnauthorizedException('OTP expired or invalid');
        }

        const user = await this.userRepo.findOne({ where: { email } });
        console.log('Found user:', user);
        if (!user) throw new UnauthorizedException('User not found');

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            groupId: user.groupId,
        };

        const token = this.jwtService.sign(payload);
        console.log('Generated JWT token:', token);
        return { token };
    }
 /*-------------------------------Set Password--------------------------------*/
    async setPassword(email: string, newPassword: string) {
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.userRepo.update({ email }, {
            password: hashed,
            isOtpVerified: true,
        });

        await this.otpRepo.delete({ email });
        return { message: 'Password set successfully. OTP expired.' };
    }

 /*-------------------------------Login By Password--------------------------------*/
    async loginWithPassword(email: string, password: string): Promise<{ token: string }> {
        const user = await this.userRepo.findOne({ where: { email } });

        if (!user || !user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            groupId: user.groupId,
        };

        const token = this.jwtService.sign(payload);
        return { token };
    }

  /*-------------------------------Refresh Token--------------------------------*/
    async generateJwt(user: {
        id: string;
        email: string;
        role: string;
        groupId?: string;
    }): Promise<{ token: string; user: any }> {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            groupId: user.groupId,
        };

        const token = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });

        return {
            token,
            user, // optional, for frontend use
        };
    }

}
