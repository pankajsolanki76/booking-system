import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateShowDto } from './dto/create-show.dto';

import { ShowRepository } from './show.repository';

import { EventRepository } from '../event/event.repository';

import { ScreenRepository } from '../screen/screen.repository';

@Injectable()
export class ShowService {
  constructor(
    private readonly showRepository: ShowRepository,

    private readonly eventRepository: EventRepository,

    private readonly screenRepository: ScreenRepository,
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

    return this.showRepository.create({
      eventId: createShowDto.eventId,

      screenId: createShowDto.screenId,

      startTime: new Date(createShowDto.startTime),

      endTime: new Date(createShowDto.endTime),

      availableSeats: screen.totalSeats,
    });
  }

  async findAll() {
    return this.showRepository.findAll();
  }
}
