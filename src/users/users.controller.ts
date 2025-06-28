// src/users/users.controller.ts
import {
    Controller,
    Post,
    Delete,
    Body,
    Get,
    Param,
    Request,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
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

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POWER_USER, UserRole.SUPPORT)
    async getUsers(@Request() req) {
        return this.usersService.getVisibleUsers(req.user);
    }
    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async deleteUser(@Request() req, @Param('id') id: string) {
        return this.usersService.deleteUserByRoleAware(id, req.user);
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.POWER_USER, UserRole.SUPPORT)
    async getOneUser(@Param('id') id: string, @Request() req) {
        return this.usersService.getOneVisibleUser(id, req.user);
    }

}
