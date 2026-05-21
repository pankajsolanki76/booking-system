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
import { Event } from '@prisma/client';

import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Role } from '../common/enums/role.enum';
import { QueryEventDto } from './dto/query-event.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { BaseController } from '../common/controllers/base.controller';

@ApiTags('Events')
@Controller('events')
export class EventController extends BaseController<
  Event,
  CreateEventDto,
  UpdateEventDto,
  QueryEventDto
> {
  constructor(private readonly eventService: EventService) {
    super(eventService);
  }

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
  override async create(
    @Body()
    createEventDto: CreateEventDto,
  ) {
    return this.eventService.create(createEventDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Get paginated events',
  })
  @ApiResponse({
    status: 200,
    description: 'Events fetched successfully',
  })
  override async findAll(@Query() query: QueryEventDto) {
    return this.eventService.findAll(query);
  }

  @Get(':id')
  @Auth()
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
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
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
  override async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return super.update(id, updateEventDto);
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
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }
  @Patch(':id/restore')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Restore deleted event',
  })
  @ApiResponse({
    status: 200,
    description: 'Event restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Deleted event not found',
  })
  async restore(@Param('id') id: string) {
    return this.eventService.restore(id);
  }
}
