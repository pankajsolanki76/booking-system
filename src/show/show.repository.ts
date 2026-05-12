import { Show, Prisma } from '@prisma/client';
import { BaseFindAllQuery } from '../common/interfaces/repository-query.interface';
import { Injectable } from '@nestjs/common';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

export interface ShowFindAllQuery extends BaseFindAllQuery {
  eventId?: string;
}

@Injectable()
export class ShowRepository extends PrismaBaseRepository<Show> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.show);
  }

  async findAll(query: ShowFindAllQuery) {
    const {
      skip,
      take,
      eventId,
      sortBy = 'startTime',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.ShowWhereInput = {};

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
