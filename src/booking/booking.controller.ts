import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Booking } from '@prisma/client';

import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Query } from '@nestjs/common';
import { QueryBookingDto } from './dto/query-booking.dto';
import { BaseController } from '../common/controllers/base.controller';
import { Role } from '../common/enums/role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { UpdateBookingDto } from './dto/update-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingController extends BaseController<
  Booking,
  CreateBookingDto,
  UpdateBookingDto,
  QueryBookingDto
> {
  constructor(private readonly bookingService: BookingService) {
    super(bookingService);
  }

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
  override async create(
    @Body()
    createBookingDto: CreateBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.createBooking(user.id, createBookingDto);
  }

  @Get('me')
  @Auth()
  @ApiOperation({
    summary: 'Get paginated booking history',
  })
  async getMyBookings(
    @CurrentUser() user: any,
    @Query() query: QueryBookingDto,
  ) {
    return this.bookingService.getMyBookings(user.id, query);
  }

  @Get(':id')
  @Auth()
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
  override async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingService.getBookingById(id, user);
  }

  @Get('admin/all')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Get all bookings (Admin only)' })
  override async findAll(@Query() query: QueryBookingDto) {
    return super.findAll(query);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Update booking (Admin only)' })
  override async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return super.update(id, updateBookingDto);
  }

  @Patch(':id/cancel')
  @Auth()
  @ApiOperation({ summary: 'Cancel booking (User or Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
  })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.cancelBooking(id, user.id, user.role);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Cancel/Delete booking (Admin only)' })
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }

  @Get(':id/ticket')
  @Auth()
  @ApiOperation({ summary: 'Get ticket and QR code (Owner or Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Ticket details retrieved successfully',
  })
  async getTicket(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.getTicketDetails(id, user);
  }

  @Patch(':id/verify-ticket')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Verify ticket and check-in (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Check-in successful',
  })
  async verifyTicket(@Param('id') id: string) {
    return this.bookingService.verifyTicket(id);
  }
}


