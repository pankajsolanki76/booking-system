import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { PrismaBaseRepository } from '../common/repositories/base.repository';

import { Category } from '@prisma/client';

@Injectable()
export class CategoryRepository extends PrismaBaseRepository<Category> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.category);
  }

  async findByName(name: string) {
    return this.prisma.category.findFirst({
      where: {
        name,

        isDeleted: false,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findFirst({
      where: {
        slug,

        isDeleted: false,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.category.findFirst({
      where: {
        id,

        isDeleted: false,
      },
    });
  }

  async findAll(search?: string) {
    return this.findMany({
      where: {
        isDeleted: false,

        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,

                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.category.update({
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
    return this.prisma.category.update({
      where: {
        id,
      },

      data: {
        isDeleted: false,

        deletedAt: null,
      },
    });
  }
  async findDeletedById(id: string) {
    return this.prisma.category.findFirst({
      where: {
        id,

        isDeleted: true,
      },
    });
  }
}
