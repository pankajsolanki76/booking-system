import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ScreenSeat } from '@prisma/client';

import { SeatService } from './seat.service';
import { CreateScreenSeatDto } from './dto/create-screen-seat.dto';
import { BulkCreateScreenSeatDto } from './dto/bulk-create-screen-seat.dto';
import { Role } from '../common/enums/role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { BaseController } from '../common/controllers/base.controller';
import { UpdateScreenSeatDto } from './dto/update-screen-seat.dto';

@ApiTags('Seats')
@Controller('seats')
export class SeatController extends BaseController<
  ScreenSeat,
  CreateScreenSeatDto,
  UpdateScreenSeatDto
> {
  constructor(private readonly seatService: SeatService) {
    super(seatService);
  }

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Create screen seat',
  })
  @ApiResponse({
    status: 201,
    description: 'Seat created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid screen',
  })
  async createScreenSeat(
    @Body()
    createSeatDto: CreateScreenSeatDto,
  ) {
    return this.seatService.createScreenSeat(createSeatDto);
  }

  @Post('bulk')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Bulk create screen seats for a specific row',
  })
  @ApiResponse({
    status: 201,
    description: 'Seats created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or screen',
  })
  async bulkCreateScreenSeats(
    @Body()
    bulkDto: BulkCreateScreenSeatDto,
  ) {
    return this.seatService.bulkCreateScreenSeats(bulkDto);
  }

  @Get('show/:showId')
  @Auth()
  @ApiOperation({
    summary: 'Get seats for a show',
  })
  @ApiResponse({
    status: 200,
    description: 'Show seats fetched successfully',
  })
  async getShowSeats(@Param('showId') showId: string) {
    return this.seatService.getShowSeats(showId);
  }

  @Sse('show/:showId/sse')
  @Auth()
  @ApiOperation({
    summary: 'Stream real-time seat updates for a show',
  })
  async streamShowSeats(
    @Param('showId') showId: string,
  ): Promise<Observable<MessageEvent>> {
    return this.seatService.getShowSeatUpdates(showId);
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Get screen seat by ID' })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Update screen seat' })
  @ApiResponse({
    status: 200,
    description: 'Seat updated successfully',
  })
  override async update(
    @Param('id') id: string,
    @Body() updateSeatDto: UpdateScreenSeatDto,
  ) {
    return super.update(id, updateSeatDto);
  }

  @Patch(':id/deactivate')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Deactivate seat',
  })
  async deactivateSeat(@Param('id') id: string) {
    return this.seatService.deactivateSeat(id);
  }
  @Patch(':id/activate')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Activate seat',
  })
  async activateSeat(@Param('id') id: string) {
    return this.seatService.activateSeat(id);
  }
}
