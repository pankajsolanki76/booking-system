import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventService extends BaseService<Event> {
  constructor(
    private readonly eventRepository: EventRepository,

    private readonly categoryRepository: CategoryRepository,

    private readonly prisma: PrismaService,
  ) {
    super(eventRepository);
  }

  override async create(createEventDto: CreateEventDto) {
    const normalizedTitle = createEventDto.title.trim();

    const category = await this.categoryRepository.findById(
      createEventDto.categoryId,
    );

    if (!category) {
      throw new BadRequestException('Invalid category');
    }

    const existingEvent =
      await this.eventRepository.findByTitle(normalizedTitle);

    if (existingEvent) {
      throw new BadRequestException('Event already exists');
    }

    const slug = await generateUniqueSlug(
      normalizedTitle,

      async (s) => !!(await this.eventRepository.findBySlug(s)),
    );

    return super.create({
      ...createEventDto,

      title: normalizedTitle,

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

    const safeLimit = Math.min(limit, 50);

    const allowedSortFields = ['createdAt', 'title', 'updatedAt'];

    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const { skip, take } = buildPagination(page, safeLimit);

    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.title = {
        contains: search.trim(),

        mode: 'insensitive',
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const result = await this.eventRepository.findAllEvents({
      where,

      skip,

      take,

      orderBy: {
        [finalSortBy]: sortOrder,
      },

      include: {
        category: true,
      },
    });

    return createPaginatedResponse({
      data: result.data,

      total: result.total,

      page,

      limit: safeLimit,
    });
  }

  override async update(
    id: string,

    updateEventDto: UpdateEventDto,
  ) {
    const event = await this.eventRepository.findById(id);

    if (!event) {
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
      const normalizedTitle = updateEventDto.title.trim();

      const existing = await this.eventRepository.findByTitle(normalizedTitle);

      if (existing && existing.id !== id) {
        throw new BadRequestException('Event already exists');
      }

      const newSlug = await generateUniqueSlug(
        normalizedTitle,

        async (s) => {
          const existingSlug = await this.eventRepository.findBySlug(s);

          return !!existingSlug && existingSlug.id !== id;
        },
      );

      slugUpdate = {
        slug: newSlug,
      };

      updateEventDto.title = normalizedTitle;
    }

    return super.update(id, {
      ...updateEventDto,

      ...slugUpdate,
    });
  }

  override async remove(id: string): Promise<any> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check for active bookings on shows of this event
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        show: {
          eventId: id,
        },
        bookingStatus: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
    });

    if (activeBooking) {
      throw new BadRequestException(
        'Cannot delete event because it has shows with active bookings',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Soft delete event
      await tx.event.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 2. Soft delete shows of this event
      await tx.show.updateMany({
        where: {
          eventId: id,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });

    return {
      message: 'Event deleted successfully',
    };
  }

  async restore(id: string) {
    const event = await this.eventRepository.findDeletedById(id);

    if (!event) {
      throw new NotFoundException('Deleted event not found');
    }

    const existingEvent = await this.eventRepository.findByTitle(event.title);
    if (existingEvent) {
      throw new BadRequestException(
        'Cannot restore event because an active event with the same title already exists',
      );
    }

    const existingSlug = await this.eventRepository.findBySlug(event.slug);
    if (existingSlug) {
      throw new BadRequestException(
        'Cannot restore event because slug is already in use',
      );
    }

    await this.eventRepository.restore(id);

    return {
      message: 'Event restored successfully',
    };
  }
}
