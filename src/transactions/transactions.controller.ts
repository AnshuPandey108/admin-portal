// src/transactions/transactions.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get,Delete,Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
    constructor(private readonly txService: TransactionsService) { }

    @Post()
    @Roles(UserRole.USER)
    async create(@Body() dto: CreateTransactionDto, @Request() req) {
        return this.txService.create(dto, req.user);
    }
    @Get()
    @Roles(
        UserRole.USER,
        UserRole.POWER_USER,
        UserRole.ADMIN,
        UserRole.SUPPORT,
        UserRole.SUPER_ADMIN
    )
    async findAll(@Request() req) {
        return this.txService.getAllForUser(req.user);
    }


    @Delete(':id')
    @Roles(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    async delete(@Param('id') id: string, @Request() req) {
        return this.txService.deleteTransaction(id, req.user);
    }

}
