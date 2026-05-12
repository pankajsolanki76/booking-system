import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CategoryRepository } from './category.repository';

import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { slugify, generateUniqueSlug } from '../common/utils/slugify.util';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ) {
    const existing =
      await this.categoryRepository.findByName(
        createCategoryDto.name,
      );

    if (existing) {
      throw new BadRequestException(
        'Category already exists',
      );
    }

    const slug = await generateUniqueSlug(
      createCategoryDto.name,
      async (s) => !!(await this.categoryRepository.findBySlug(s)),
    );

    return this.categoryRepository.create({
      ...createCategoryDto,
      slug,
    });
  }

  async findAll(query: QueryCategoryDto) {
    return this.categoryRepository.findAll(
      query.search,
    );
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category =
      await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    let slugUpdate = {};
    if (updateCategoryDto.name) {
      const newSlug = await generateUniqueSlug(
        updateCategoryDto.name,
        async (s) => {
          const existing = await this.categoryRepository.findBySlug(s);
          return !!existing && existing.id !== id;
        },
      );
      slugUpdate = { slug: newSlug };
    }

    return this.categoryRepository.update(id, {
      ...updateCategoryDto,
      ...slugUpdate,
    });
  }

  async remove(id: string) {
    const category =
      await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    await this.categoryRepository.delete(id);

    return {
      message: 'Category deleted successfully',
    };
  }
}