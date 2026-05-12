import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(
    tx: Prisma.TransactionClient,
    data: Prisma.PaymentUncheckedCreateInput,
  ) {
    return tx.payment.create({
      data,
    });
  }
}
