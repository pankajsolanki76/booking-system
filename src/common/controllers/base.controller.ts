import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BaseService } from '../services/base.service';

export abstract class BaseController<T, CreateDto, UpdateDto, QueryDto = any> {
  constructor(protected readonly service: BaseService<T>) {}

  @Post()
  async create(@Body() createDto: CreateDto, ...args: any[]): Promise<any> {
    return this.service.create(createDto);
  }

  @Get()
  async findAll(@Query() query: QueryDto): Promise<any> {
    return this.service.findAll({ where: query });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, ...args: any[]): Promise<any> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDto,
    ...args: any[]
  ): Promise<any> {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, ...args: any[]): Promise<any> {
    return this.service.remove(id);
  }
}

