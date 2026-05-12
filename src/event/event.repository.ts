import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.event.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },

      include: {
        category: true,
        shows: true,
      },
    });
  }
  async findAll(query: any) {
    const { skip, take, search, categoryId, sortBy, sortOrder } = query;

    const where: any = {};

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,

        skip,

        take,

        orderBy: {
          [sortBy]: sortOrder,
        },

        include: {
          category: true,
        },
      }),

      this.prisma.event.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }
  async update(id: string, data: any) {
    return this.prisma.event.update({
      where: { id },

      data,
    });
  }

  async delete(id: string) {
    return this.prisma.event.delete({
      where: { id },
    });
  }
}
