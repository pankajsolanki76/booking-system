import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SeatService } from './seat.service';

import { CreateScreenSeatDto } from './dto/create-screen-seat.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

@ApiTags('Seats')
@ApiBearerAuth('JWT-auth')
@Controller('seats')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
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
