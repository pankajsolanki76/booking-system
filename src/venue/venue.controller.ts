import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { VenueService } from './venue.service';

import { CreateVenueDto } from './dto/create-venue.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createVenueDto: CreateVenueDto) {
    return this.venueService.create(createVenueDto);
  }

  @Get()
  async findAll(@Query('city') city?: string) {
    return this.venueService.findAll(city);
  }
}
