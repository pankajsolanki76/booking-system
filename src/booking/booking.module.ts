import { Module } from '@nestjs/common';

import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

import { BookingRepository } from './booking.repository';

import { SeatModule } from '../seat/seat.module';
import { BookingExpirationService } from './booking-expiration.service';

@Module({
  imports: [SeatModule],

  controllers: [BookingController],

  providers: [BookingService, BookingRepository, BookingExpirationService],
  exports: [BookingRepository],
})
export class BookingModule {}
