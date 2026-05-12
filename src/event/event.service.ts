import { BadRequestException, Injectable } from '@nestjs/common';

import { CategoryRepository } from '../category/category.repository';

import { slugify } from '../common/utils/slugify.util';

import { CreateEventDto } from './dto/create-event.dto';

import { EventRepository } from './event.repository';
import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,

    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const category = await this.categoryRepository.findById(
      createEventDto.categoryId,
    );

    if (!category) {
      throw new BadRequestException('Invalid category');
    }

    return this.eventRepository.create({
      ...createEventDto,

      slug: slugify(createEventDto.title),
    });
  }

  async findAll(queryDto: QueryEventDto) {
    const {
      page = 1,

      limit = 10,

      sortBy = 'createdAt',

      sortOrder = 'desc',
    } = queryDto;

    const { skip, take } = buildPagination(page, limit);

    const result = await this.eventRepository.findAll({
      ...queryDto,

      skip,

      take,

      sortBy,

      sortOrder,
    });

    return createPaginatedResponse({
      data: result.data,

      total: result.total,

      page,

      limit,
    });
  }

  async findOne(id: string) {
    return this.eventRepository.findById(id);
  }
}
