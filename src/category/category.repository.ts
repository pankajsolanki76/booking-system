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
    return this.prisma.category.findUnique({
      where: { name },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
    });
  }

  async findAll(search?: string) {
    return this.prisma.category.findMany({
      where: search
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
        : undefined,

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}