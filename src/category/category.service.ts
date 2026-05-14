import {
  BadRequestException,
  Injectable,
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
    const existing = await this.categoryRepository.findByName(
      createCategoryDto.name,
    );

    if (existing) {
      throw new BadRequestException('Category already exists');
    }

    const slug = await generateUniqueSlug(
      createCategoryDto.name,
      async (s) => !!(await this.categoryRepository.findBySlug(s)),
    );

    return super.create({
      ...createCategoryDto,
      slug,
    });
  }

  override async findAll(query: any) {
    const search = query?.search || query?.where?.search;
    return this.categoryRepository.findAll(search);
  }

  override async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // BaseService.update calls findOne which throws NotFoundException if not found
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

    return super.update(id, {
      ...updateCategoryDto,
      ...slugUpdate,
    });
  }

  override async remove(id: string): Promise<any> {
    await super.remove(id);
    return {
      message: 'Category deleted successfully',
    };
  }
}


