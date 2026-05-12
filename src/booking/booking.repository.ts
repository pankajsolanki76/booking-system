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
}
