import { Controller, Get, Query, Patch, Body, Post, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Get('verify-otp')
    async verifyOtp(
        @Query('email') email: string,
        @Query('code') code: string,
    ) {
        return this.authService.verifyOtp(email, code);
    }


    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        const { email, password } = body;
        return this.authService.loginWithPassword(email, password);
    }


    @Post('refresh-token')
    @UseGuards(JwtAuthGuard) // 🛡️ must pass valid (not yet expired) token
    async refreshToken(@Request() req) {
        return this.authService.generateJwt(req.user);
    }


    @Patch('set-password')
    @UseGuards(JwtAuthGuard)
    async setPassword(
        @Request() req,

        @Body('newPassword') newPassword: string,
    ) {
        console.log('Setting password for user:', newPassword);
        if (!newPassword || newPassword.length < 6) {
            throw new UnauthorizedException('Password must be at least 6 characters');
        }
        return this.authService.setPassword(req.user.email, newPassword);
    }
}
