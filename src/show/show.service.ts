import { BadRequestException, Injectable } from '@nestjs/common';
import { Show } from '@prisma/client';
import { BaseService } from '../common/services/base.service';

import { CreateShowDto } from './dto/create-show.dto';

import { ShowRepository } from './show.repository';

import { EventRepository } from '../event/event.repository';

import { ScreenRepository } from '../screen/screen.repository';
import { SeatRepository } from '../seat/seat.repository';
import { QueryShowDto } from './dto/query-show.dto';

import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';

@Injectable()
export class ShowService extends BaseService<Show> {
  constructor(
    private readonly showRepository: ShowRepository,

    private readonly eventRepository: EventRepository,

    private readonly screenRepository: ScreenRepository,

    private readonly seatRepository: SeatRepository,
  ) {
    super(showRepository);
  }

  override async create(createShowDto: CreateShowDto) {
    const event = await this.eventRepository.findById(createShowDto.eventId);

    if (!event) {
      throw new BadRequestException('Invalid event');
    }

    const screen = await this.screenRepository.findById(createShowDto.screenId);

    if (!screen) {
      throw new BadRequestException('Invalid screen');
    }

    const show = await super.create({
      eventId: createShowDto.eventId,

      screenId: createShowDto.screenId,

      startTime: new Date(createShowDto.startTime),

      endTime: new Date(createShowDto.endTime),

      availableSeats: screen.totalSeats,
    });

    const screenSeats = await this.screenRepository.getSeats(screen.id);

    await this.seatRepository.createShowSeats(
      screenSeats.map((seat) => ({
        showId: show.id,

        screenSeatId: seat.id,
      })),
    );

    return show;
  }

  override async findAll(queryDto: QueryShowDto) {
    const {
      page = 1,

      limit = 10,

      sortBy = 'startTime',

      sortOrder = 'asc',

      eventId,
    } = queryDto;

    const { skip, take } = buildPagination(page, limit);

    const where: any = {};
    if (eventId) {
      where.eventId = eventId;
    }

    const result = await this.showRepository.findAllShows({
      where,

      skip,

      take,

      orderBy: {
        [sortBy]: sortOrder,
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

      limit,
    });
  }
}

