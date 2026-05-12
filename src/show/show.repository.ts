import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShowRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(data: any) {
    return this.prisma.show.create({
      data,
    });
  }

  async findAll(filters?: any) {
    return this.prisma.show.findMany({
      where: filters,

      include: {
        event: {
          include: {
            category: true,
          },
        },
      },

      orderBy: {
        startTime: 'asc',
      },
    });
  }
}