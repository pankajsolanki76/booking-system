import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Show, Prisma } from '@prisma/client';

import { BaseService } from '../common/services/base.service';

import { CreateShowDto } from './dto/create-show.dto';

import { ShowRepository } from './show.repository';

import { EventRepository } from '../event/event.repository';

import { ScreenRepository } from '../screen/screen.repository';

import { SeatRepository } from '../seat/seat.repository';

import { QueryShowDto } from './dto/query-show.dto';

import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShowService extends BaseService<Show> {
  constructor(
    private readonly prisma: PrismaService,

    private readonly showRepository: ShowRepository,

    private readonly eventRepository: EventRepository,

    private readonly screenRepository: ScreenRepository,

    private readonly seatRepository: SeatRepository,
  ) {
    super(showRepository);
  }

  override async create(createShowDto: CreateShowDto) {
    const startTime = new Date(createShowDto.startTime);

    const endTime = new Date(createShowDto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (startTime <= new Date()) {
      throw new BadRequestException('Show start time must be in the future');
    }

    const event = await this.eventRepository.findById(createShowDto.eventId);

    if (!event) {
      throw new BadRequestException('Invalid event');
    }

    const screen = await this.screenRepository.findById(createShowDto.screenId);

    if (!screen) {
      throw new BadRequestException('Invalid screen');
    }

    const overlappingShow = await this.showRepository.findOverlappingShow({
      screenId: createShowDto.screenId,

      startTime,

      endTime,
    });

    if (overlappingShow) {
      throw new BadRequestException(
        'Screen already has another show scheduled during this time',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const show = await tx.show.create({
          data: {
            eventId: createShowDto.eventId,

            screenId: createShowDto.screenId,

            startTime,

            endTime,

            availableSeats: screen.totalSeats,
          },
        });

        const screenSeats = await this.screenRepository.getSeats(screen.id);

        await tx.showSeat.createMany({
          data: screenSeats.map((seat) => ({
            showId: show.id,

            screenSeatId: seat.id,
          })),
        });

        return show;
      },

      {
        timeout: 10000,
      },
    );
  }

  override async findAll(queryDto: QueryShowDto) {
    const {
      page = 1,

      limit = 10,

      sortBy = 'startTime',

      sortOrder = 'asc',

      eventId,
    } = queryDto;

    const safeLimit = Math.min(limit, 50);

    const allowedSortFields = [
      'startTime',
      'endTime',
      'createdAt',
      'updatedAt',
    ];

    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'startTime';

    const { skip, take } = buildPagination(page, safeLimit);

    const where: Prisma.ShowWhereInput = {};

    if (eventId) {
      where.eventId = eventId;
    }

    const result = await this.showRepository.findAllShows({
      where,

      skip,

      take,

      orderBy: {
        [finalSortBy]: sortOrder,
      },

      include: {
        event: true,

        screen: {
          include: {
            venue: true,
          },
        },
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

    data: any,
  ) {
    const existingShow = await this.showRepository.findById(id);

    if (!existingShow) {
      throw new NotFoundException('Show not found');
    }

    const startTime = data.startTime
      ? new Date(data.startTime)
      : existingShow.startTime;

    const endTime = data.endTime
      ? new Date(data.endTime)
      : existingShow.endTime;

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const overlappingShow = await this.showRepository.findOverlappingShow({
      screenId: data.screenId || existingShow.screenId,

      startTime,

      endTime,

      excludeShowId: id,
    });

    if (overlappingShow) {
      throw new BadRequestException(
        'Screen already has another show scheduled during this time',
      );
    }

    return super.update(id, {
      ...data,

      startTime,

      endTime,
    });
  }
  override async remove(id: string): Promise<any> {
    const show = await this.showRepository.findById(id);

    if (!show) {
      throw new NotFoundException('Show not found');
    }

    /**
     * Prevent deleting shows
     * with active bookings
     */
    const hasBookings = show.bookings.some(
      (booking) =>
        booking.bookingStatus === 'CONFIRMED' ||
        booking.bookingStatus === 'PENDING',
    );

    if (hasBookings) {
      throw new BadRequestException('Cannot delete show with active bookings');
    }

    await this.showRepository.softDelete(id);

    return {
      message: 'Show deleted successfully',
    };
  }
  async restore(id: string) {
    const deletedShow = await this.showRepository.findDeletedById(id);

    if (!deletedShow) {
      throw new NotFoundException('Deleted show not found');
    }

    /**
     * Prevent restoring past shows
     */
    if (deletedShow.endTime < new Date()) {
      throw new BadRequestException('Cannot restore past shows');
    }

    /**
     * Prevent overlap conflicts
     */
    const overlappingShow = await this.showRepository.findOverlappingShow({
      screenId: deletedShow.screenId,

      startTime: deletedShow.startTime,

      endTime: deletedShow.endTime,
    });

    if (overlappingShow) {
      throw new BadRequestException(
        'Cannot restore show because another overlapping show exists',
      );
    }

    await this.showRepository.restore(id);

    return {
      message: 'Show restored successfully',
    };
  }
}
