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
import { Show } from '@prisma/client';

import { ShowService } from './show.service';
import { CreateShowDto } from './dto/create-show.dto';
import { Role } from '../common/enums/role.enum';
import { QueryShowDto } from './dto/query-show.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { BaseController } from '../common/controllers/base.controller';
import { UpdateShowDto } from './dto/update-show.dto';

@ApiTags('Shows')
@Controller('shows')
export class ShowController extends BaseController<
  Show,
  CreateShowDto,
  UpdateShowDto,
  QueryShowDto
> {
  constructor(private readonly showService: ShowService) {
    super(showService);
  }

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Create show',
  })
  @ApiResponse({
    status: 201,
    description: 'Show created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid event or screen',
  })
  override async create(
    @Body()
    createShowDto: CreateShowDto,
  ) {
    return this.showService.create(createShowDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Get paginated shows',
  })
  @ApiResponse({
    status: 200,
    description: 'Shows fetched successfully',
  })
  override async findAll(@Query() query: QueryShowDto) {
    return this.showService.findAll(query);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Get show by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Show fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Show not found',
  })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }


  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Update show',
  })
  @ApiResponse({
    status: 200,
    description: 'Show updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Show not found',
  })
  override async update(
    @Param('id') id: string,
    @Body() updateShowDto: UpdateShowDto,
  ) {
    return super.update(id, updateShowDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete show',
  })
  @ApiResponse({
    status: 200,
    description: 'Show deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Show not found',
  })
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }
}

