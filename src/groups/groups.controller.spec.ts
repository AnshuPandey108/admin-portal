// src/groups/groups.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { UserRole } from '../users/entities/user.entity';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;

  const mockGroup: Group = {
    id: 'uuid-1',
    name: 'Engineering',
    cdt: new Date(),
    ldt: new Date(),
  };

  const mockGroupsService = {
    create: jest.fn().mockResolvedValue(mockGroup),
    findAll: jest.fn().mockResolvedValue([mockGroup]),
    findOne: jest.fn().mockResolvedValue(mockGroup),
    update: jest.fn().mockResolvedValue({ ...mockGroup, name: 'Updated Name' }),
    delete: jest.fn().mockResolvedValue({ message: 'Group deleted' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a group', async () => {
    const result = await controller.create('Engineering');
    expect(result).toEqual(mockGroup);
    expect(service.create).toHaveBeenCalledWith('Engineering');
  });

  it('should return all groups', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockGroup]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return a group by ID', async () => {
    const result = await controller.findOne('uuid-1');
    expect(result).toEqual(mockGroup);
    expect(service.findOne).toHaveBeenCalledWith('uuid-1');
  });

  it('should update a group', async () => {
    const result = await controller.update('uuid-1', 'Updated Name');
    expect(result.name).toBe('Updated Name');
    expect(service.update).toHaveBeenCalledWith('uuid-1', 'Updated Name');
  });

  it('should delete a group', async () => {
    const result = await controller.delete('uuid-1');
    expect(result).toEqual({ message: 'Group deleted' });
    expect(service.delete).toHaveBeenCalledWith('uuid-1');
  });
});
