import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScreenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.screen.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.screen.findUnique({
      where: { id },

      include: {
        venue: true,
      },
    });
  }

  async findAll() {
    return this.prisma.screen.findMany({
      include: {
        venue: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
