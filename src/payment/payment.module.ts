import { Module } from '@nestjs/common';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

import { PaymentRepository } from './payment.repository';

import { BookingModule } from '../booking/booking.module';

import { SeatModule } from '../seat/seat.module';

@Module({
  imports: [BookingModule, SeatModule],

  controllers: [PaymentController],

  providers: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
