import { BadRequestException, Injectable } from '@nestjs/common';
import { Screen } from '@prisma/client';
import { BaseService } from '../common/services/base.service';

import { CreateScreenDto } from './dto/create-screen.dto';

import { ScreenRepository } from './screen.repository';

import { VenueRepository } from '../venue/venue.repository';

@Injectable()
export class ScreenService extends BaseService<Screen> {
  constructor(
    private readonly screenRepository: ScreenRepository,

    private readonly venueRepository: VenueRepository,
  ) {
    super(screenRepository);
  }

  override async create(createScreenDto: CreateScreenDto) {
    const venue = await this.venueRepository.findById(createScreenDto.venueId);

    if (!venue) {
      throw new BadRequestException('Invalid venue');
    }

    return super.create(createScreenDto);
  }

  async findAllScreens() {
    return this.screenRepository.findAllScreens();
  }
}

