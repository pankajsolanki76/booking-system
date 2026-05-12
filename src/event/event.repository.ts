import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(data: any) {
    return this.prisma.event.create({
      data,
    });
  }

  async findAll(filters?: any) {
    return this.prisma.event.findMany({
      where: filters,

      include: {
        category: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
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
}