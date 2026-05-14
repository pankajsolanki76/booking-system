import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ScreenSeat } from '@prisma/client';
import { PrismaBaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class SeatRepository extends PrismaBaseRepository<ScreenSeat> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.screenSeat);
  }

  async createScreenSeat(data: Prisma.ScreenSeatUncheckedCreateInput) {
    return this.create(data);
  }

  async findScreenSeatById(id: string) {
    return this.findById(id);
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

