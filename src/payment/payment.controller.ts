import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Payment } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { BaseController } from '../common/controllers/base.controller';
import { Role } from '../common/enums/role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentController extends BaseController<
  Payment,
  any,
  UpdatePaymentDto
> {
  constructor(private readonly paymentService: PaymentService) {
    super(paymentService);
  }

  @Patch(':bookingId/process')
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
    return this.paymentService.processPayment(bookingId, dto.simulateSuccess);
  }

  @Get()
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Get all payments (Admin only)' })
  override async findAll() {
    return super.findAll({});
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Get payment details (Admin only)' })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Update payment record (Admin only)' })
  override async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return super.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Delete payment record (Admin only)' })
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }
}


