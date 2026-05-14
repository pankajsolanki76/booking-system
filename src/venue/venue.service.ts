import { BadRequestException, Injectable } from '@nestjs/common';
import { Venue } from '@prisma/client';
import { BaseService } from '../common/services/base.service';

import { CreateVenueDto } from './dto/create-venue.dto';

import { VenueRepository } from './venue.repository';

import { generateUniqueSlug } from '../common/utils/slugify.util';
import { QueryVenueDto } from './dto/query-venue.dto';

import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';

@Injectable()
export class VenueService extends BaseService<Venue> {
  constructor(private readonly venueRepository: VenueRepository) {
    super(venueRepository);
  }

  override async create(createVenueDto: CreateVenueDto) {
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

    return super.create({
      ...createVenueDto,
      slug,
    });
  }

  override async findAll(queryDto: QueryVenueDto) {
    const {
      page = 1,

      limit = 10,

      city,

      sortBy = 'createdAt',

      sortOrder = 'desc',
    } = queryDto;

    const { skip, take } = buildPagination(page, limit);

    const where: any = {};
    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    const result = await this.venueRepository.findAllVenues({
      where,

      skip,

      take,

      orderBy: {
        [sortBy]: sortOrder,
      },

      include: {
        screens: true,
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

