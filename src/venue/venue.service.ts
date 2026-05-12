import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateVenueDto } from './dto/create-venue.dto';

import { VenueRepository } from './venue.repository';

import { slugify, generateUniqueSlug } from '../common/utils/slugify.util';
import { QueryVenueDto } from './dto/query-venue.dto';

import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';

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

    const slug = await generateUniqueSlug(
      createVenueDto.name,
      async (s) => !!(await this.venueRepository.findBySlug(s)),
    );

    return this.venueRepository.create({
      ...createVenueDto,
      slug,
    });
  }

  async findAll(queryDto: QueryVenueDto) {
    const {
      page = 1,

      limit = 10,

      city,

      sortBy = 'createdAt',

      sortOrder = 'desc',
    } = queryDto;

    const { skip, take } = buildPagination(page, limit);

    const result = await this.venueRepository.findAll({
      city,

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
