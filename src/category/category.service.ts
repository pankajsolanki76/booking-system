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

@Injectable()
export class CategoryService extends BaseService<Category> {
  constructor(private readonly categoryRepository: CategoryRepository) {
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

    await this.categoryRepository.softDelete(id);

    return {
      message: 'Category deleted successfully',
    };
  }

  async restore(id: string) {
    const category = await this.categoryRepository.findDeletedById(id);

    if (!category) {
      throw new NotFoundException('Deleted category not found');
    }

    await this.categoryRepository.restore(id);

    return {
      message: 'Category restored successfully',
    };
  }
}
