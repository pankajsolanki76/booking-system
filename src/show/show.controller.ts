import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ShowService } from './show.service';
import { CreateShowDto } from './dto/create-show.dto';
import { Role } from '../common/enums/role.enum';
import { QueryShowDto } from './dto/query-show.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Shows')
@Controller('shows')
export class ShowController {
  constructor(private readonly showService: ShowService) {}

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
  async create(
    @Body()
    createShowDto: CreateShowDto,
  ) {
    return this.showService.create(createShowDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated shows',
  })
  @ApiResponse({
    status: 200,
    description: 'Shows fetched successfully',
  })
  async findAll(@Query() query: QueryShowDto) {
    return this.showService.findAll(query);
  }
}
