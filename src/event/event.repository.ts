import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { Event, Prisma } from '@prisma/client';

import { BaseFindAllQuery } from '../common/interfaces/repository-query.interface';

export interface EventFindAllQuery extends BaseFindAllQuery {
  search?: string;
  categoryId?: string;
}

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

  async findAllEvents(params: {
    where?: Prisma.EventWhereInput;
    skip?: number;
    take?: number;
    orderBy?: any;
    include?: any;
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
}

