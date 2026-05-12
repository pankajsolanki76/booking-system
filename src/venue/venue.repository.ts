import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.venue.create({
      data,
    });
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

  async findById(id: string) {
    return this.prisma.venue.findUnique({
      where: { id },

      include: {
        screens: true,
      },
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
