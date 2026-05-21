import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { PrismaBaseRepository } from '../common/repositories/base.repository';

import { Event, Prisma } from '@prisma/client';

@Injectable()
export class EventRepository extends PrismaBaseRepository<Event> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.event);
  }

  override async findById(id: string) {
    return this.prisma.event.findFirst({
      where: {
        id,

        isDeleted: false,
      },

      include: {
        category: true,

        shows: true,
      },
    });
  }

  async findDeletedById(id: string) {
    return this.prisma.event.findFirst({
      where: {
        id,

        isDeleted: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.event.findFirst({
      where: {
        slug,

        isDeleted: false,
      },
    });
  }

  async findByTitle(title: string) {
    return this.prisma.event.findFirst({
      where: {
        title,

        isDeleted: false,
      },
    });
  }

  async findAllEvents(params: {
    where?: Prisma.EventWhereInput;

    skip?: number;

    take?: number;

    orderBy?: Prisma.EventOrderByWithRelationInput;

    include?: Prisma.EventInclude;
  }) {
    const finalWhere: Prisma.EventWhereInput = {
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
    return this.prisma.event.update({
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
    return this.prisma.event.update({
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
