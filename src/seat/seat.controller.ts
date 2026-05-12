import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SeatService } from './seat.service';
import { CreateScreenSeatDto } from './dto/create-screen-seat.dto';
import { Role } from '../common/enums/role.enum';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Seats')
@Controller('seats')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

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

  @Get('show/:showId')
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
}
