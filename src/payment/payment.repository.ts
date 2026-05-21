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

  async findByBookingId(bookingId: string) {
    return this.prisma.payment.findUnique({
      where: {
        bookingId,
      },
    });
  }

  override async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: {
        id,
      },

      include: {
        booking: {
          include: {
            user: true,

            show: {
              include: {
                event: true,

                screen: {
                  include: {
                    venue: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAllPayments(params: {
    where?: Prisma.PaymentWhereInput;

    skip?: number;

    take?: number;

    orderBy?: Prisma.PaymentOrderByWithRelationInput;

    include?: Prisma.PaymentInclude;
  }) {
    const [data, total] = await Promise.all([
      this.findMany(params),

      this.count(params.where),
    ]);

    return {
      data,

      total,
    };
  }

  async existingPayment(
    tx: Prisma.TransactionClient,

    bookingId: string,
  ) {
    return tx.payment.findUnique({
      where: {
        bookingId,
      },
    });
  }
}
