// src/transactions/transactions.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get, Delete, Param, Patch } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/create-transaction.dto';
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

    @Get(':id')
    @Roles(
        UserRole.USER,
        UserRole.POWER_USER,
        UserRole.ADMIN,
        UserRole.SUPPORT,
        UserRole.SUPER_ADMIN
    )
    async findOne(@Param('id') id: string, @Request() req) {
        return this.txService.getOneById(id, req.user);
    }


    @Patch(':id')
    @Roles(UserRole.USER)
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateTransactionDto,
        @Request() req
    ) {
        return this.txService.updateTransaction(id, dto, req.user);
    }

}
