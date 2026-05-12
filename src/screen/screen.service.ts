import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateScreenDto } from './dto/create-screen.dto';

import { ScreenRepository } from './screen.repository';

import { VenueRepository } from '../venue/venue.repository';

@Injectable()
export class ScreenService {
  constructor(
    private readonly screenRepository: ScreenRepository,

    private readonly venueRepository: VenueRepository,
  ) {}

  async create(createScreenDto: CreateScreenDto) {
    const venue = await this.venueRepository.findById(createScreenDto.venueId);

    if (!venue) {
      throw new BadRequestException('Invalid venue');
    }

    return this.screenRepository.create(createScreenDto);
  }

  async findAll() {
    return this.screenRepository.findAll();
  }
}
