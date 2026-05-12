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

  async findAll(city?: string) {
    return this.prisma.venue.findMany({
      where: city
        ? {
            city: {
              equals: city,
              mode: 'insensitive',
            },
          }
        : undefined,

      include: {
        screens: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
