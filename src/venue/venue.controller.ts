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
import { Venue } from '@prisma/client';

import { BaseController } from '../common/controllers/base.controller';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { Role } from '../common/enums/role.enum';
import { QueryVenueDto } from './dto/query-venue.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { UpdateVenueDto } from './dto/update-venue.dto';

@ApiTags('Venues')
@Controller('venues')
export class VenueController extends BaseController<
  Venue,
  CreateVenueDto,
  UpdateVenueDto,
  QueryVenueDto
> {
  constructor(private readonly venueService: VenueService) {
    super(venueService);
  }

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
  override async create(
    @Body()
    createVenueDto: CreateVenueDto,
  ) {
    return super.create(createVenueDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Get paginated venues',
  })
  @ApiResponse({
    status: 200,
    description: 'Venues fetched successfully',
  })
  override async findAll(@Query() query: QueryVenueDto) {
    return this.venueService.findAll(query);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Get venue by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Update venue',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  override async update(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    return super.update(id, updateVenueDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete venue',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }
  @Patch(':id/restore')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Restore deleted venue',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Deleted venue not found',
  })
  async restore(@Param('id') id: string) {
    return this.venueService.restore(id);
  }
}
