import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { SeatService } from './seat.service';

import { CreateScreenSeatDto } from './dto/create-screen-seat.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

@Controller('seats')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createScreenSeat(
    @Body()
    createSeatDto: CreateScreenSeatDto,
  ) {
    return this.seatService.createScreenSeat(createSeatDto);
  }

  @Get('show/:showId')
  async getShowSeats(@Param('showId') showId: string) {
    return this.seatService.getShowSeats(showId);
  }
}
