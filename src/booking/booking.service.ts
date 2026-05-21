import { Injectable } from '@nestjs/common';

import { Prisma, SeatStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeatRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find available seats
   * IMPORTANT:
   * Uses transaction client
   * to avoid stale reads/race conditions
   */
  async findAvailableShowSeats(
    tx: Prisma.TransactionClient,
    showId: string,
    seatIds: string[],
  ) {
    return tx.showSeat.findMany({
      where: {
        id: {
          in: seatIds,
        },

        showId,

        status: SeatStatus.AVAILABLE,
      },

      include: {
        screenSeat: true,
      },
    });
  }

  /**
   * Lock seats temporarily
   */
  async lockSeats(
    tx: Prisma.TransactionClient,
    seatIds: string[],
    lockedUntil: Date,
  ) {
    return tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },

        status: SeatStatus.AVAILABLE,
      },

      data: {
        status: SeatStatus.LOCKED,

        lockedAt: new Date(),

        lockedUntil,
      },
    });
  }

  /**
   * Mark seats as booked
   */
  async bookSeats(tx: Prisma.TransactionClient, seatIds: string[]) {
    return tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },

        status: SeatStatus.LOCKED,
      },

      data: {
        status: SeatStatus.BOOKED,

        bookedAt: new Date(),

        lockedAt: null,

        lockedUntil: null,
      },
    });
  }

  /**
   * Release locked seats
   */
  async releaseSeats(tx: Prisma.TransactionClient, seatIds: string[]) {
    return tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },

        status: SeatStatus.LOCKED,
      },

      data: {
        status: SeatStatus.AVAILABLE,

        lockedAt: null,

        lockedUntil: null,
      },
    });
  }
}
