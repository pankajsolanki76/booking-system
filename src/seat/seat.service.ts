import { BadRequestException, Injectable } from '@nestjs/common';
import { ScreenSeat } from '@prisma/client';
import { BaseService } from '../common/services/base.service';

import { ScreenRepository } from '../screen/screen.repository';

import { CreateScreenSeatDto } from './dto/create-screen-seat.dto';

import { SeatRepository } from './seat.repository';

@Injectable()
export class SeatService extends BaseService<ScreenSeat> {
  constructor(
    private readonly seatRepository: SeatRepository,

    private readonly screenRepository: ScreenRepository,
  ) {
    super(seatRepository);
  }

  async createScreenSeat(createSeatDto: CreateScreenSeatDto) {
    const screen = await this.screenRepository.findById(createSeatDto.screenId);

    if (!screen) {
      throw new BadRequestException('Invalid screen');
    }

    const seatNumber = createSeatDto.seatNumber.trim().toUpperCase();

    const rowLabel = createSeatDto.rowLabel.trim().toUpperCase();

    const existingSeat = await this.seatRepository.findSeatByNumber(
      createSeatDto.screenId,

      seatNumber,
    );

    if (existingSeat) {
      throw new BadRequestException('Seat already exists in this screen');
    }

    return this.seatRepository.createScreenSeat({
      ...createSeatDto,

      seatNumber,

      rowLabel,
    });
  }

  async getShowSeats(showId: string) {
    return this.seatRepository.findShowSeats(showId);
  }
  async deactivateSeat(id: string) {
    const seat = await this.seatRepository.findById(id);

    if (!seat) {
      throw new BadRequestException('Seat not found');
    }

    if (!seat.isActive) {
      throw new BadRequestException('Seat already inactive');
    }

    await this.seatRepository.deactivateSeat(id);

    return {
      message: 'Seat deactivated successfully',
    };
  }
  async activateSeat(id: string) {
    const seat = await this.seatRepository.findById(id);

    if (!seat) {
      throw new BadRequestException('Seat not found');
    }

    if (seat.isActive) {
      throw new BadRequestException('Seat already active');
    }

    await this.seatRepository.activateSeat(id);

    return {
      message: 'Seat activated successfully',
    };
  }
}
