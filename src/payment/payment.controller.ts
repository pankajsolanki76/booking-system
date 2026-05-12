import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PaymentService } from './payment.service';

import { ProcessPaymentDto } from './dto/process-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Patch(':bookingId')
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @Param('bookingId')
    bookingId: string,

    @Body()
    dto: ProcessPaymentDto,
  ) {
    return this.paymentService.processPayment(
      bookingId,

      dto.simulateSuccess,
    );
  }
}
