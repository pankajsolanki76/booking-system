import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Payment } from '@prisma/client';

import { PaymentService } from './payment.service';

import { ProcessPaymentDto } from './dto/process-payment.dto';

import { BaseController } from '../common/controllers/base.controller';

import { Role } from '../common/enums/role.enum';

import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentController extends BaseController<Payment, any, never> {
  constructor(private readonly paymentService: PaymentService) {
    super(paymentService);
  }

  @Patch(':bookingId/process')
  @Auth()
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

  @Get()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all payments (Admin only)',
  })
  override async findAll(@Query() query: any) {
    return super.findAll(query);
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Get payment details (Admin only)',
  })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }
}
