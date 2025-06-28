import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
  ) {}

  async create(name: string): Promise<Group> {
    const existingGroup = await this.groupRepo.findOne({ where: { name } });
    if (existingGroup) {
        throw new NotFoundException('Group with this name already exists');
    }
    const group = this.groupRepo.create({ name });
    return this.groupRepo.save(group);
  }

  async findAll(): Promise<Group[]> {
    return this.groupRepo.find();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async update(id: string, name: string): Promise<Group> {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    group.name = name;
    return this.groupRepo.save(group);
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.groupRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Group not found');
    }
    return { message: 'Group deleted successfully' };
  }
}
