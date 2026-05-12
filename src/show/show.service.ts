import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateShowDto } from './dto/create-show.dto';

import { ShowRepository } from './show.repository';

import { EventRepository } from '../event/event.repository';

import { ScreenRepository } from '../screen/screen.repository';
import { SeatRepository } from '../seat/seat.repository';
import { QueryShowDto } from './dto/query-show.dto';

import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';

@Injectable()
export class ShowService {
  constructor(
    private readonly showRepository: ShowRepository,

    private readonly eventRepository: EventRepository,

    private readonly screenRepository: ScreenRepository,

    private readonly seatRepository: SeatRepository,
  ) {}

  async create(createShowDto: CreateShowDto) {
    const event = await this.eventRepository.findById(createShowDto.eventId);

    if (!event) {
      throw new BadRequestException('Invalid event');
    }

    const screen = await this.screenRepository.findById(createShowDto.screenId);

    if (!screen) {
      throw new BadRequestException('Invalid screen');
    }

    const show = await this.showRepository.create({
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

  async findAll(queryDto: QueryShowDto) {
    const {
      page = 1,

      limit = 10,

      sortBy = 'startTime',

      sortOrder = 'asc',
    } = queryDto;

    const { skip, take } = buildPagination(page, limit);

    const result = await this.showRepository.findAll({
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
}
