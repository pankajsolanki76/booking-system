import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SeatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createScreenSeat(data: any) {
    return this.prisma.screenSeat.create({
      data,
    });
  }

  async findScreenSeatById(id: string) {
    return this.prisma.screenSeat.findUnique({
      where: { id },
    });
  }

  async createShowSeats(data: any[]) {
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
  async lockSeats(tx: any, seatIds: string[], expiresAt: Date) {
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
  async bookSeats(tx: any, seatIds: string[]) {
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
  async releaseSeats(tx: any, seatIds: string[]) {
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
