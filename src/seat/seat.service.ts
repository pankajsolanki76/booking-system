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

    return this.seatRepository.createScreenSeat(createSeatDto);
  }

  async getShowSeats(showId: string) {
    return this.seatRepository.findShowSeats(showId);
  }
}

