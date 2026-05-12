import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(tx: any, data: any) {
    return tx.payment.create({
      data,
    });
  }
}
