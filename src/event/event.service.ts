import { BadRequestException, Injectable } from '@nestjs/common';
import { Event, Prisma } from '@prisma/client';
import { BaseService } from '../common/services/base.service';

import { CategoryRepository } from '../category/category.repository';

import { generateUniqueSlug } from '../common/utils/slugify.util';

import { CreateEventDto } from './dto/create-event.dto';

import { EventRepository } from './event.repository';
import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';
import { QueryEventDto } from './dto/query-event.dto';

import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService extends BaseService<Event> {
  constructor(
    private readonly eventRepository: EventRepository,

    private readonly categoryRepository: CategoryRepository,
  ) {
    super(eventRepository);
  }

  override async create(createEventDto: CreateEventDto) {
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

    return super.create({
      ...createEventDto,

      slug,
    });
  }

  override async findAll(queryDto: QueryEventDto) {
    const {
      page = 1,

      limit = 10,

      sortBy = 'createdAt',

      sortOrder = 'desc',

      search,

      categoryId,
    } = queryDto;

    const { skip, take } = buildPagination(page, limit);

    const where: Prisma.EventWhereInput = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const result = await this.eventRepository.findAllEvents({
      where,

      skip,

      take,

      orderBy: {
        [sortBy]: sortOrder,
      },

      include: {
        category: true,
      },
    });

    return createPaginatedResponse({
      data: result.data,

      total: result.total,

      page,

      limit,
    });
  }

  override async update(id: string, updateEventDto: UpdateEventDto) {
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

    return super.update(id, {
      ...updateEventDto,

      ...slugUpdate,
    });
  }
}

