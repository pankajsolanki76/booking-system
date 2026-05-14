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
import { Category } from '@prisma/client';

import { BaseController } from '../common/controllers/base.controller';
import { Role } from '../common/enums/role.enum';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController extends BaseController<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto
> {
  constructor(private readonly categoryService: CategoryService) {
    super(categoryService);
  }

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Create category',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  override async create(
    @Body()
    createCategoryDto: CreateCategoryDto,
  ) {
    return super.create(createCategoryDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Get all categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories fetched successfully',
  })
  override async findAll(@Query() query: QueryCategoryDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Get category by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
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
  override async update(
    @Param('id') id: string,

    @Body()
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return super.update(id, updateCategoryDto);
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
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }
}

