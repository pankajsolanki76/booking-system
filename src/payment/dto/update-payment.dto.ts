import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentDto {
  @ApiProperty({ enum: PaymentStatus, required: false })
  status?: PaymentStatus;

  @ApiProperty({ required: false })
  transactionRef?: string;
}
