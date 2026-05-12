import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.show.create({
      data,
    });
  }

  async findAll(query: any) {
    const { skip, take, eventId, sortBy, sortOrder } = query;

    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    const [data, total] = await Promise.all([
      this.prisma.show.findMany({
        where,

        skip,

        take,

        orderBy: {
          [sortBy]: sortOrder,
        },

        include: {
          event: true,

          screen: {
            include: {
              venue: true,
            },
          },
        },
      }),

      this.prisma.show.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }
}
