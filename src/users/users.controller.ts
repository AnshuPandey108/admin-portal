// src/users/users.controller.ts
import {
    Controller,
    Post,
    Body,
    Request,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('create')
    async createUser(
        @Request() req,
        @Body() body: { email: string; role: UserRole; groupId?: string }
    ) {
        // req.user was populated by JwtStrategy.validate()
        const creator = req.user as {
            email: string;
            role: UserRole;
            groupId?: string;
        };

        // delegate to service
        return this.usersService.createUserAndSendOtp(
            body.email,
            body.role,
            body.groupId,
            creator
        );
    }
}
