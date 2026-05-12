import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { EventService } from './event.service';

import { CreateEventDto } from './dto/create-event.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';
import { Query } from '@nestjs/common';

import { QueryEventDto } from './dto/query-event.dto';

@ApiTags('Events')
@ApiBearerAuth('JWT-auth')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create event',
  })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async create(
    @Body()
    createEventDto: CreateEventDto,
  ) {
    return this.eventService.create(createEventDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all events',
  })
  @ApiResponse({
    status: 200,
    description: 'Events fetched successfully',
  })
  @Get()
  @ApiOperation({
    summary: 'Get paginated events',
  })
  @ApiResponse({
    status: 200,
    description: 'Events fetched successfully',
  })
  async findAll(@Query() query: QueryEventDto) {
    return this.eventService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single event details',
  })
  @ApiResponse({
    status: 200,
    description: 'Event fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }
}
