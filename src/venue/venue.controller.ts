import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { Role } from '../common/enums/role.enum';
import { QueryVenueDto } from './dto/query-venue.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Venues')
@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  @Auth(Role.ADMIN)
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
