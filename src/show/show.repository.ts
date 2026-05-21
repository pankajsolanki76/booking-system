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
    const [data, total] = await Promise.all([
      this.findMany(params),

      this.count(params.where),
    ]);

    return {
      data,

      total,
    };
  }

  async findOverlappingShow(params: {
    screenId: string;

    startTime: Date;

    endTime: Date;

    excludeShowId?: string;
  }) {
    const {
      screenId,

      startTime,

      endTime,

      excludeShowId,
    } = params;

    return this.prisma.show.findFirst({
      where: {
        screenId,

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
