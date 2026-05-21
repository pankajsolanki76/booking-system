import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { Prisma, Booking } from '@prisma/client';

import { PrismaBaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class BookingRepository extends PrismaBaseRepository<Booking> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.booking);
  }

  async createBooking(
    tx: Prisma.TransactionClient,
    data: Prisma.BookingUncheckedCreateInput,
  ): Promise<Booking> {
    return tx.booking.create({
      data,
    });
  }

  async createBookingSeats(
    tx: Prisma.TransactionClient,
    data: Prisma.BookingSeatUncheckedCreateInput[],
  ) {
    return tx.bookingSeat.createMany({
      data,
    });
  }

  /**
   * Transaction-safe booking lookup
   */
  async findBookingById(tx: Prisma.TransactionClient, bookingId: string) {
    return tx.booking.findUnique({
      where: {
        id: bookingId,
      },

      include: {
        bookingSeats: true,
      },
    });
  }

  override async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },

      include: {
        bookingSeats: true,
      },
    });
  }

  /**
   * Find expired pending bookings
   */
  async findExpiredBookings() {
    return this.prisma.booking.findMany({
      where: {
        bookingStatus: 'PENDING',

        expiresAt: {
          lte: new Date(),
        },
      },

      include: {
        bookingSeats: true,
      },
    });
  }

  /**
   * Expire booking
   */
  async expireBooking(tx: Prisma.TransactionClient, bookingId: string) {
    return tx.booking.update({
      where: {
        id: bookingId,
      },

      data: {
        bookingStatus: 'EXPIRED',
      },
    });
  }

  async findUserBookings(params: {
    userId: string;

    where?: Prisma.BookingWhereInput;

    skip?: number;

    take?: number;

    orderBy?: Prisma.BookingOrderByWithRelationInput;

    include?: Prisma.BookingInclude;
  }) {
    const { userId, where, ...rest } = params;

    const finalWhere: Prisma.BookingWhereInput = {
      ...where,

      userId,
    };

    const [data, total] = await Promise.all([
      this.findMany({
        where: finalWhere,

        ...rest,
      }),

      this.count(finalWhere),
    ]);

    return {
      data,

      total,
    };
  }
}
