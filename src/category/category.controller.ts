import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Role } from '../common/enums/role.enum';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Create category',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  async create(
    @Body()
    createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories fetched successfully',
  })
  async findAll(@Query() query: QueryCategoryDto) {
    return this.categoryService.findAll(query);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Update category',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async update(
    @Param('id') id: string,

    @Body()
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete category',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
