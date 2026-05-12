import { Module } from '@nestjs/common';

import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

import { BookingRepository } from './booking.repository';

import { SeatModule } from '../seat/seat.module';

@Module({
  imports: [SeatModule],

  controllers: [BookingController],

  providers: [BookingService, BookingRepository],
})
export class BookingModule {}
