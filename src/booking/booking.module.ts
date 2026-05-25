import { Module } from '@nestjs/common';

import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

import { BookingRepository } from './booking.repository';

import { SeatModule } from '../seat/seat.module';
import { BookingExpirationService } from './booking-expiration.service';
import { TicketModule } from '../ticket/ticket.module';
import { StripeModule } from '../payment/stripe.module';
import { WaitlistModule } from '../waitlist/waitlist.module';

@Module({
  imports: [SeatModule, TicketModule, StripeModule, WaitlistModule],

  controllers: [BookingController],

  providers: [BookingService, BookingRepository, BookingExpirationService],
  exports: [BookingRepository],
})
export class BookingModule {}
