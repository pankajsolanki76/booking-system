import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BookingService } from './booking.service';

import { CreateBookingDto } from './dto/create-booking.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Query } from '@nestjs/common';

import { QueryBookingDto } from './dto/query-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create booking and lock seats',
  })
  @ApiResponse({
    status: 201,
    description: 'Seats locked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Some seats are unavailable',
  })
  async createBooking(
    @CurrentUser() user: any,

    @Body()
    createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.createBooking(user.id, createBookingDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get paginated booking history',
  })
  async getMyBookings(
    @CurrentUser() user: any,

    @Query() query: QueryBookingDto,
  ) {
    return this.bookingService.getMyBookings(
      user.id,

      query,
    );
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get booking details',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking fetched successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async getBookingById(
    @Param('id') id: string,

    @CurrentUser() user: any,
  ) {
    return this.bookingService.getBookingById(id, user);
  }
}
