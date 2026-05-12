import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { BookingService } from './booking.service';

import { CreateBookingDto } from './dto/create-booking.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Get, Param } from '@nestjs/common';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBooking(
    @CurrentUser() user: any,

    @Body()
    createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.createBooking(user.id, createBookingDto);
  }
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@CurrentUser() user: any) {
    return this.bookingService.getMyBookings(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getBookingById(@Param('id') id: string) {
    return this.bookingService.getBookingById(id);
  }
}
