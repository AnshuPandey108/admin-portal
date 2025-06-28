import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Patch,
  Body,
} from '@nestjs/common';
import { Roles }    from '../auth/roles.decorator'; 
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
@Controller('groups')
@UseGuards(JwtAuthGuard ,RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@Body('name') name: string): Promise<Group> {
    return this.groupsService.create(name);
  }

  @Get()
  async findAll(): Promise<Group[]> {
    return this.groupsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Group> {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body('name') name: string,
  ): Promise<Group> {
    return this.groupsService.update(id, name);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.groupsService.delete(id);
  }
}
