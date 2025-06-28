// src/groups/groups.service.spec.ts
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('GroupsService', () => {
  let service: GroupsService;
  let repo: jest.Mocked<Repository<Group>>;

  const mockGroup: Group = {
    id: 'uuid-1',
    name: 'Engineering',
  };

  beforeEach(() => {
    const repoMock: Partial<Repository<Group>> = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    service = new GroupsService(repoMock as Repository<Group>);
    repo = repoMock as jest.Mocked<Repository<Group>>;
  });

  it('should create a new group if name not exists', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(mockGroup);
    repo.save.mockResolvedValue(mockGroup);

    const result = await service.create('Engineering');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { name: 'Engineering' } });
    expect(repo.create).toHaveBeenCalledWith({ name: 'Engineering' });
    expect(repo.save).toHaveBeenCalledWith(mockGroup);
    expect(result).toEqual(mockGroup);
  });

  it('should throw if group with same name exists', async () => {
    repo.findOne.mockResolvedValue(mockGroup);

    await expect(service.create('Engineering')).rejects.toThrow(NotFoundException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should return all groups', async () => {
    repo.find.mockResolvedValue([mockGroup]);
    const result = await service.findAll();

    expect(repo.find).toHaveBeenCalled();
    expect(result).toEqual([mockGroup]);
  });

  it('should return group by id', async () => {
    repo.findOne.mockResolvedValue(mockGroup);

    const result = await service.findOne('uuid-1');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
    expect(result).toEqual(mockGroup);
  });

  it('should throw if group not found by id', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne('uuid-1')).rejects.toThrow(NotFoundException);
  });

  it('should update group name', async () => {
    repo.findOne.mockResolvedValue({ ...mockGroup });
    repo.save.mockResolvedValue({ ...mockGroup, name: 'Updated Name' });

    const result = await service.update('uuid-1', 'Updated Name');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
    expect(repo.save).toHaveBeenCalledWith({ ...mockGroup, name: 'Updated Name' });
    expect(result.name).toEqual('Updated Name');
  });

  it('should throw if group not found for update', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.update('uuid-1', 'Updated')).rejects.toThrow(NotFoundException);
  });

 it('should delete group by id', async () => {
  repo.delete.mockResolvedValue({ affected: 1, raw: {} }); // ✅

  const result = await service.delete('uuid-1');
  expect(result).toEqual({ message: 'Group deleted successfully' });
});

it('should throw if group not found during delete', async () => {
  repo.delete.mockResolvedValue({ affected: 0, raw: {} }); // ✅

  await expect(service.delete('uuid-1')).rejects.toThrow(NotFoundException);
});


  
});
