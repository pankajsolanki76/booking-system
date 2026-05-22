import { Show, Prisma } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { PrismaBaseRepository } from '../common/repositories/base.repository';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShowRepository extends PrismaBaseRepository<Show> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.show);
  }

  async findAllShows(params: {
    where?: Prisma.ShowWhereInput;

    skip?: number;

    take?: number;

    orderBy?: Prisma.ShowOrderByWithRelationInput;

    include?: Prisma.ShowInclude;
  }) {
    const finalWhere: Prisma.ShowWhereInput = {
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

  async findOverlappingShow(
    params: {
      screenId: string;

      startTime: Date;

      endTime: Date;

      excludeShowId?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const {
      screenId,

      startTime,

      endTime,

      excludeShowId,
    } = params;

    return client.show.findFirst({
      where: {
        screenId,

        isDeleted: false,

        ...(excludeShowId
          ? {
              id: {
                not: excludeShowId,
              },
            }
          : {}),

        AND: [
          {
            startTime: {
              lt: endTime,
            },
          },

          {
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
    });
  }

  override async findById(id: string) {
    return this.prisma.show.findFirst({
      where: {
        id,

        isDeleted: false,
      },

      include: {
        bookings: true,

        showSeats: true,
      },
    });
  }

  async findDeletedById(id: string) {
    return this.prisma.show.findFirst({
      where: {
        id,

        isDeleted: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.show.update({
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
    return this.prisma.show.update({
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
