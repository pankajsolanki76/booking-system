import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Payment } from '@prisma/client';
import { PrismaBaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class PaymentRepository extends PrismaBaseRepository<Payment> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.payment);
  }

  async createPayment(
    tx: Prisma.TransactionClient,
    data: Prisma.PaymentUncheckedCreateInput,
  ) {
    return tx.payment.create({
      data,
    });
  }
}

