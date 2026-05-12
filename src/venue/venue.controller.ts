import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { VenueService } from './venue.service';

import { CreateVenueDto } from './dto/create-venue.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';
import { QueryVenueDto } from './dto/query-venue.dto';

@ApiTags('Venues')
@ApiBearerAuth('JWT-auth')
@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create venue',
  })
  @ApiResponse({
    status: 201,
    description: 'Venue created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Venue already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async create(
    @Body()
    createVenueDto: CreateVenueDto,
  ) {
    return this.venueService.create(createVenueDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated venues',
  })
  @ApiResponse({
    status: 200,
    description: 'Venues fetched successfully',
  })
  async findAll(@Query() query: QueryVenueDto) {
    return this.venueService.findAll(query);
  }
}
