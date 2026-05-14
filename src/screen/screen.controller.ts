import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Screen } from '@prisma/client';

import { ScreenService } from './screen.service';
import { CreateScreenDto } from './dto/create-screen.dto';
import { Role } from '../common/enums/role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { BaseController } from '../common/controllers/base.controller';
import { UpdateScreenDto } from './dto/update-screen.dto';

@ApiTags('Screens')
@Controller('screens')
export class ScreenController extends BaseController<
  Screen,
  CreateScreenDto,
  UpdateScreenDto
> {
  constructor(private readonly screenService: ScreenService) {
    super(screenService);
  }

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Create screen',
  })
  @ApiResponse({
    status: 201,
    description: 'Screen created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid venue',
  })
  override async create(
    @Body()
    createScreenDto: CreateScreenDto,
  ) {
    return this.screenService.create(createScreenDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Get all screens',
  })
  @ApiResponse({
    status: 200,
    description: 'Screens fetched successfully',
  })
  override async findAll() {
    return this.screenService.findAllScreens();
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Get screen by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Screen fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Screen not found',
  })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }


  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Update screen',
  })
  @ApiResponse({
    status: 200,
    description: 'Screen updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Screen not found',
  })
  override async update(
    @Param('id') id: string,
    @Body() updateScreenDto: UpdateScreenDto,
  ) {
    return super.update(id, updateScreenDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete screen',
  })
  @ApiResponse({
    status: 200,
    description: 'Screen deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Screen not found',
  })
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }
}

