import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Category } from '@prisma/client';

import { BaseService } from '../common/services/base.service';

import { CategoryRepository } from './category.repository';

import { CreateCategoryDto } from './dto/create-category.dto';

import { QueryCategoryDto } from './dto/query-category.dto';

import { UpdateCategoryDto } from './dto/update-category.dto';

import { generateUniqueSlug } from '../common/utils/slugify.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService extends BaseService<Category> {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly prisma: PrismaService,
  ) {
    super(categoryRepository);
  }

  override async create(createCategoryDto: CreateCategoryDto) {
    const normalizedName = createCategoryDto.name.trim();

    const existing = await this.categoryRepository.findByName(normalizedName);

    if (existing) {
      throw new BadRequestException('Category already exists');
    }

    const slug = await generateUniqueSlug(
      normalizedName,

      async (s) => !!(await this.categoryRepository.findBySlug(s)),
    );

    return super.create({
      ...createCategoryDto,

      name: normalizedName,

      slug,
    });
  }

  override async findAll(query: QueryCategoryDto) {
    const search = query?.search;

    return this.categoryRepository.findAll(search);
  }

  override async update(
    id: string,

    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    let slugUpdate = {};

    if (updateCategoryDto.name) {
      const normalizedName = updateCategoryDto.name.trim();

      const existing = await this.categoryRepository.findByName(normalizedName);

      if (existing && existing.id !== id) {
        throw new BadRequestException('Category already exists');
      }

      const newSlug = await generateUniqueSlug(
        normalizedName,

        async (s) => {
          const existingSlug = await this.categoryRepository.findBySlug(s);

          return !!existingSlug && existingSlug.id !== id;
        },
      );

      slugUpdate = {
        slug: newSlug,
      };

      updateCategoryDto.name = normalizedName;
    }

    return super.update(id, {
      ...updateCategoryDto,

      ...slugUpdate,
    });
  }

  override async remove(id: string): Promise<any> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for active bookings on shows of events in this category
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        show: {
          event: {
            categoryId: id,
          },
        },
        bookingStatus: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
    });

    if (activeBooking) {
      throw new BadRequestException(
        'Cannot delete category because it has events/shows with active bookings',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Soft delete category
      await tx.category.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 2. Soft delete events in category
      await tx.event.updateMany({
        where: {
          categoryId: id,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 3. Soft delete shows of events in category
      await tx.show.updateMany({
        where: {
          event: {
            categoryId: id,
          },
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });

    return {
      message: 'Category deleted successfully',
    };
  }

  async restore(id: string) {
    const category = await this.categoryRepository.findDeletedById(id);

    if (!category) {
      throw new NotFoundException('Deleted category not found');
    }

    const existingCategory = await this.categoryRepository.findByName(
      category.name,
    );

    if (existingCategory) {
      throw new BadRequestException(
        'Cannot restore category because an active category with the same name already exists',
      );
    }

    const existingSlug = await this.categoryRepository.findBySlug(
      category.slug,
    );

    if (existingSlug) {
      throw new BadRequestException(
        'Cannot restore category because slug is already in use',
      );
    }

    await this.categoryRepository.restore(id);

    return {
      message: 'Category restored successfully',
    };
  }
}
