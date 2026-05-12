import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { Event } from '@prisma/client';

@Injectable()
export class EventRepository extends PrismaBaseRepository<Event> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.event);
  }

  override async findById(id: string) {
    return super.findById(id, {
      category: true,
      shows: true,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.event.findUnique({
      where: { slug },
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
}
