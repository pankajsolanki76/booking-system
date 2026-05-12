import { Body, Controller, Get, Param, Post, Patch, Delete } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Role } from '../common/enums/role.enum';
import { Query } from '@nestjs/common';
import { QueryEventDto } from './dto/query-event.dto';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @Auth(Role.ADMIN)
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
  async create(
    @Body()
    createEventDto: CreateEventDto,
  ) {
    return this.eventService.create(createEventDto);
  }

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

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Update event details',
  })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete event',
  })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}
