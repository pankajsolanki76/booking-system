import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CategoryRepository } from '../category/category.repository';

import { slugify, generateUniqueSlug } from '../common/utils/slugify.util';

import { CreateEventDto } from './dto/create-event.dto';

import { EventRepository } from './event.repository';
import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';
import { QueryEventDto } from './dto/query-event.dto';

import { UpdateEventDto } from './dto/update-event.dto';

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

    const slug = await generateUniqueSlug(
      createEventDto.title,
      async (s) => !!(await this.eventRepository.findBySlug(s)),
    );

    return this.eventRepository.create({
      ...createEventDto,

      slug,
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
  async update(id: string, updateEventDto: UpdateEventDto) {
    const existingEvent = await this.eventRepository.findById(id);

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    if (updateEventDto.categoryId) {
      const category = await this.categoryRepository.findById(
        updateEventDto.categoryId,
      );

      if (!category) {
        throw new BadRequestException('Invalid category');
      }
    }

    let slugUpdate = {};
    if (updateEventDto.title) {
      const newSlug = await generateUniqueSlug(
        updateEventDto.title,
        async (s) => {
          const existing = await this.eventRepository.findBySlug(s);
          return !!existing && existing.id !== id;
        },
      );
      slugUpdate = { slug: newSlug };
    }

    return this.eventRepository.update(id, {
      ...updateEventDto,

      ...slugUpdate,
    });
  }

  async remove(id: string) {
    const existingEvent = await this.eventRepository.findById(id);

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    return this.eventRepository.delete(id);
  }
}
