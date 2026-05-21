import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { PrismaBaseRepository } from '../common/repositories/base.repository';

import { Venue, Prisma } from '@prisma/client';

@Injectable()
export class VenueRepository extends PrismaBaseRepository<Venue> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.venue);
  }

  async findByName(name: string) {
    return this.prisma.venue.findFirst({
      where: {
        name: {
          equals: name,

          mode: 'insensitive',
        },

        isDeleted: false,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.venue.findFirst({
      where: {
        slug,

        isDeleted: false,
      },
    });
  }

  override async findById(id: string) {
    return this.prisma.venue.findFirst({
      where: {
        id,

        isDeleted: false,
      },

      include: {
        screens: true,
      },
    });
  }

  async findDeletedById(id: string) {
    return this.prisma.venue.findFirst({
      where: {
        id,

        isDeleted: true,
      },
    });
  }

  async findAllVenues(params: {
    where?: Prisma.VenueWhereInput;

    skip?: number;

    take?: number;

    orderBy?: Prisma.VenueOrderByWithRelationInput;

    include?: Prisma.VenueInclude;
  }) {
    const finalWhere: Prisma.VenueWhereInput = {
      isDeleted: false,

      ...params.where,
    };

    const [data, total] = await Promise.all([
      this.findMany({
        ...params,

        where: finalWhere,
      }),

      this.count(finalWhere),
    ]);

    return {
      data,

      total,
    };
  }

  async softDelete(id: string) {
    return this.prisma.venue.update({
      where: {
        id,
      },

      data: {
        isDeleted: true,

        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string) {
    return this.prisma.venue.update({
      where: {
        id,
      },

      data: {
        isDeleted: false,

        deletedAt: null,
      },
    });
  }
}
