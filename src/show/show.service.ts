import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateShowDto } from './dto/create-show.dto';

import { EventRepository } from '../event/event.repository';

import { ShowRepository } from './show.repository';

@Injectable()
export class ShowService {
  constructor(
    private readonly showRepository: ShowRepository,

    private readonly eventRepository: EventRepository,
  ) {}

  async create(createShowDto: CreateShowDto) {
    const event = await this.eventRepository.findById(createShowDto.eventId);

    if (!event) {
      throw new BadRequestException('Invalid event');
    }

    return this.showRepository.create({
      ...createShowDto,

      startTime: new Date(createShowDto.startTime),

      endTime: new Date(createShowDto.endTime),

      availableSeats: createShowDto.totalSeats,
    });
  }

  async findAll() {
    return this.showRepository.findAll();
  }
}
