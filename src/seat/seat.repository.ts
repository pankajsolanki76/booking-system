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
    return this.prisma.screenSeat.findFirst({
      where: {
        id,

        isActive: true,
      },
    });
  }

  async findSeatByNumber(
    screenId: string,

    rowLabel: string,

    seatNumber: number,
  ) {
    return this.prisma.screenSeat.findFirst({
      where: {
        screenId,

        rowLabel,

        seatNumber,
      },
    });
  }

  async createShowSeats(data: Prisma.ShowSeatUncheckedCreateInput[]) {
    return this.prisma.showSeat.createMany({
      data,
    });
  }

  async findShowSeats(showId: string) {
    return this.prisma.showSeat.findMany({
      where: {
        showId,

        screenSeat: {
          isActive: true,
        },
      },

      include: {
        screenSeat: true,
      },
    });
  }

  async findAvailableShowSeats(
    showId: string,

    seatIds: string[],
  ) {
    return this.prisma.showSeat.findMany({
      where: {
        id: {
          in: seatIds,
        },

        showId,

        status: 'AVAILABLE',

        screenSeat: {
          isActive: true,
        },
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

  async bookSeats(
    tx: Prisma.TransactionClient,

    seatIds: string[],
  ) {
    return tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },

        status: 'LOCKED',

        lockedUntil: {
          gt: new Date(),
        },
      },

      data: {
        status: 'BOOKED',

        bookedAt: new Date(),

        lockedAt: null,

        lockedUntil: null,
      },
    });
  }

  async releaseSeats(
    tx: Prisma.TransactionClient,

    seatIds: string[],
  ) {
    return tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },

        status: 'LOCKED',
      },

      data: {
        status: 'AVAILABLE',

        lockedAt: null,

        lockedUntil: null,
      },
    });
  }

  async hasShowSeats(screenSeatId: string) {
    const count = await this.prisma.showSeat.count({
      where: {
        screenSeatId,
      },
    });

    return count > 0;
  }

  async deactivateSeat(id: string) {
    return this.prisma.screenSeat.update({
      where: {
        id,
      },

      data: {
        isActive: false,
      },
    });
  }

  async activateSeat(id: string) {
    return this.prisma.screenSeat.update({
      where: {
        id,
      },

      data: {
        isActive: true,
      },
    });
  }
}
