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

  override async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },

      include: {
        bookingSeats: true,
      },
    });
  }

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
    orderBy?: any;
    include?: any;
  }) {
    const { userId, ...rest } = params;
    const [data, total] = await Promise.all([
      this.findMany(rest),
      this.count(rest.where),
    ]);

    return {
      data,
      total,
    };
  }

}

