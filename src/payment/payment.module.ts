import { Module } from '@nestjs/common';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

import { PaymentRepository } from './payment.repository';

import { BookingModule } from '../booking/booking.module';

import { SeatModule } from '../seat/seat.module';
import { TicketModule } from '../ticket/ticket.module';
import { StripeModule } from './stripe.module';

@Module({
  imports: [BookingModule, SeatModule, TicketModule, StripeModule],

  controllers: [PaymentController],

  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService],
})
export class PaymentModule {}
