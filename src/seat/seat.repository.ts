import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SeatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createScreenSeat(data: Prisma.ScreenSeatUncheckedCreateInput) {
    return this.prisma.screenSeat.create({
      data,
    });
  }

  async findScreenSeatById(id: string) {
    return this.prisma.screenSeat.findUnique({
      where: { id },
    });
  }

  async createShowSeats(data: Prisma.ShowSeatUncheckedCreateInput[]) {
    return this.prisma.showSeat.createMany({
      data,
    });
  }

  async findShowSeats(showId: string) {
    return this.prisma.showSeat.findMany({
      where: { showId },

      include: {
        screenSeat: true,
      },
    });
  }
  async findAvailableShowSeats(showId: string, seatIds: string[]) {
    return this.prisma.showSeat.findMany({
      where: {
        id: {
          in: seatIds,
        },

        showId,

        status: 'AVAILABLE',
      },

      include: {
        screenSeat: true,
      },
    });
  }
  async lockSeats(
    tx: Prisma.TransactionClient,
    seatIds: string[],
    expiresAt: Date,
  ) {
    return tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },

        status: 'AVAILABLE',
      },

      data: {
        status: 'LOCKED',

        lockedAt: new Date(),

        lockedUntil: expiresAt,
      },
    });
  }
  async bookSeats(tx: Prisma.TransactionClient, seatIds: string[]) {
    return tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },

        status: 'LOCKED',
      },

      data: {
        status: 'BOOKED',

        bookedAt: new Date(),
      },
    });
  }
  async releaseSeats(tx: Prisma.TransactionClient, seatIds: string[]) {
    return tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },
      },

      data: {
        status: 'AVAILABLE',

        lockedAt: null,

        lockedUntil: null,
      },
    });
  }
}
