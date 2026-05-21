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

  /**
   * Create screen seat
   */
  async createScreenSeat(createSeatDto: CreateScreenSeatDto) {
    /**
     * Validate screen
     */
    const screen = await this.screenRepository.findById(createSeatDto.screenId);

    if (!screen) {
      throw new BadRequestException('Invalid screen');
    }

    /**
     * Normalize values
     */
    const rowLabel = createSeatDto.rowLabel.trim().toUpperCase();

    const seatNumber = createSeatDto.seatNumber;

    /**
     * Prevent duplicate seats
     */
    const existingSeat = await this.seatRepository.findSeatByNumber(
      createSeatDto.screenId,

      rowLabel,

      seatNumber,
    );

    if (existingSeat) {
      throw new BadRequestException('Seat already exists in this screen');
    }

    return this.seatRepository.createScreenSeat({
      ...createSeatDto,

      rowLabel,

      seatNumber,
    });
  }

  /**
   * Get seats for show
   */
  async getShowSeats(showId: string) {
    return this.seatRepository.findShowSeats(showId);
  }

  /**
   * Deactivate seat
   */
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

  /**
   * Activate seat
   */
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
