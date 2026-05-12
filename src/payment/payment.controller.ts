import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PaymentService } from './payment.service';

import { ProcessPaymentDto } from './dto/process-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Patch(':bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Process booking payment',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Booking expired or payment failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
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
