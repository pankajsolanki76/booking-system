import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ShowService } from './show.service';

import { CreateShowDto } from './dto/create-show.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

@ApiTags('Shows')
@ApiBearerAuth('JWT-auth')
@Controller('shows')
export class ShowController {
  constructor(private readonly showService: ShowService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async create(
    @Body()
    createShowDto: CreateShowDto,
  ) {
    return this.showService.create(createShowDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all shows',
  })
  @ApiResponse({
    status: 200,
    description: 'Shows fetched successfully',
  })
  async findAll() {
    return this.showService.findAll();
  }
}
