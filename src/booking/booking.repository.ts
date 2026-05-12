import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(tx: any, data: any) {
    return tx.booking.create({
      data,
    });
  }

  async createBookingSeats(tx: any, data: any[]) {
    return tx.bookingSeat.createMany({
      data,
    });
  }

  async findBookingById(id: string) {
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
  async expireBooking(tx: any, bookingId: string) {
    return tx.booking.update({
      where: {
        id: bookingId,
      },

      data: {
        bookingStatus: 'EXPIRED',
      },
    });
  }

  async findUserBookings(
    userId: string,

    query: any,
  ) {
    const { skip, take, sortBy, sortOrder } = query;

    const where = {
      userId,
    };

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,

        skip,

        take,

        orderBy: {
          [sortBy]: sortOrder,
        },

        include: {
          bookingSeats: {
            include: {
              showSeat: {
                include: {
                  screenSeat: true,
                },
              },
            },
          },

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
      }),

      this.prisma.booking.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }
}
