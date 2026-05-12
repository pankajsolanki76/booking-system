import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { Venue } from '@prisma/client';

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
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.venue.findUnique({
      where: { slug },
    });
  }

  override async findById(id: string) {
    return super.findById(id, {
      screens: true,
    });
  }

  async findAll(query: any) {
    const { skip, take, city, sortBy, sortOrder } = query;

    const where: any = {};

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,

        skip,

        take,

        orderBy: {
          [sortBy]: sortOrder,
        },

        include: {
          screens: true,
        },
      }),

      this.prisma.venue.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }
}
