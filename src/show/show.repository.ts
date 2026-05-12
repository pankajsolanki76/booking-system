import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { Show } from '@prisma/client';

@Injectable()
export class ShowRepository extends PrismaBaseRepository<Show> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.show);
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
