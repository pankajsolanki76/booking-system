import { NotFoundException } from '@nestjs/common';
import { PrismaBaseRepository } from '../repositories/base.repository';

export abstract class BaseService<T> {
  constructor(protected readonly repository: PrismaBaseRepository<T>) {}

  async create(data: any): Promise<any> {
    return this.repository.create(data);
  }

  async findAll(params: any): Promise<any> {
    return this.repository.findMany(params);
  }

  async findOne(id: string, include?: any): Promise<any> {
    const record = await this.repository.findById(id, include);
    if (!record) {
      throw new NotFoundException(`Record with ID ${id} not found`);
    }
    return record;
  }

  async update(id: string, data: any): Promise<any> {
    await this.findOne(id); // Ensure exists
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<any> {
    await this.findOne(id); // Ensure exists
    return this.repository.delete(id);
  }

  async count(where?: any): Promise<number> {
    return this.repository.count(where);
  }
}

