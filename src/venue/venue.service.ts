import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Venue, Prisma } from '@prisma/client';

import { BaseService } from '../common/services/base.service';

import { CreateVenueDto } from './dto/create-venue.dto';

import { VenueRepository } from './venue.repository';

import { generateUniqueSlug } from '../common/utils/slugify.util';

import { QueryVenueDto } from './dto/query-venue.dto';

import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';

import { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenueService extends BaseService<Venue> {
  constructor(private readonly venueRepository: VenueRepository) {
    super(venueRepository);
  }

  override async create(createVenueDto: CreateVenueDto) {
    const normalizedName = createVenueDto.name.trim();

    const existingVenue = await this.venueRepository.findByName(normalizedName);

    if (existingVenue) {
      throw new BadRequestException('Venue already exists');
    }

    const slug = await generateUniqueSlug(
      normalizedName,

      async (s) => !!(await this.venueRepository.findBySlug(s)),
    );

    return super.create({
      ...createVenueDto,

      name: normalizedName,

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

    const safeLimit = Math.min(limit, 50);

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'city'];

    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const { skip, take } = buildPagination(page, safeLimit);

    const where: Prisma.VenueWhereInput = {};

    if (city) {
      where.city = {
        contains: city.trim(),

        mode: 'insensitive',
      };
    }

    const result = await this.venueRepository.findAllVenues({
      where,

      skip,

      take,

      orderBy: {
        [finalSortBy]: sortOrder,
      },

      include: {
        _count: {
          select: {
            screens: true,
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

    updateVenueDto: UpdateVenueDto,
  ) {
    const venue = await this.venueRepository.findById(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    let slugUpdate = {};

    if (updateVenueDto.name) {
      const normalizedName = updateVenueDto.name.trim();

      const existingVenue =
        await this.venueRepository.findByName(normalizedName);

      if (existingVenue && existingVenue.id !== id) {
        throw new BadRequestException('Venue already exists');
      }

      const newSlug = await generateUniqueSlug(
        normalizedName,

        async (s) => {
          const existingSlug = await this.venueRepository.findBySlug(s);

          return !!existingSlug && existingSlug.id !== id;
        },
      );

      slugUpdate = {
        slug: newSlug,
      };

      updateVenueDto.name = normalizedName;
    }

    return super.update(id, {
      ...updateVenueDto,

      ...slugUpdate,
    });
  }

  override async remove(id: string): Promise<any> {
    const venue = await this.venueRepository.findById(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }
    if (venue.screens.length > 0) {
      throw new BadRequestException('Cannot delete venue with active screens');
    }

    await this.venueRepository.softDelete(id);

    return {
      message: 'Venue deleted successfully',
    };
  }

  async restore(id: string) {
    const deletedVenue = await this.venueRepository.findDeletedById(id);

    if (!deletedVenue) {
      throw new NotFoundException('Deleted venue not found');
    }

    const existingVenue = await this.venueRepository.findByName(
      deletedVenue.name,
    );

    if (existingVenue) {
      throw new BadRequestException(
        'Cannot restore venue because an active venue with the same name already exists',
      );
    }

    const existingSlug = await this.venueRepository.findBySlug(
      deletedVenue.slug,
    );

    if (existingSlug) {
      throw new BadRequestException(
        'Cannot restore venue because slug is already in use',
      );
    }

    await this.venueRepository.restore(id);

    return {
      message: 'Venue restored successfully',
    };
  }
}
