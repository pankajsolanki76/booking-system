import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateVenueDto } from './dto/create-venue.dto';

import { VenueRepository } from './venue.repository';

import { slugify } from '../common/utils/slugify.util';

@Injectable()
export class VenueService {
  constructor(private readonly venueRepository: VenueRepository) {}

  async create(createVenueDto: CreateVenueDto) {
    const existingVenue = await this.venueRepository.findByName(
      createVenueDto.name,
    );

    if (existingVenue) {
      throw new BadRequestException('Venue already exists');
    }

    return this.venueRepository.create({
      ...createVenueDto,

      slug: slugify(createVenueDto.name),
    });
  }

  async findAll(city?: string) {
    return this.venueRepository.findAll(city);
  }
}
