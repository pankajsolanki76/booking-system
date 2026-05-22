import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ScreenSeat, SeatStatus } from '@prisma/client';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { Subject } from 'rxjs';

@Injectable()
export class SeatRepository extends PrismaBaseRepository<ScreenSeat> {
  public readonly seatUpdates$ = new Subject<{
    showId: string;
    seatIds: string[];
    status: SeatStatus;
  }>();

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
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.showSeat.findMany({
      where: {
        id: {
          in: seatIds,
        },
        showId,
        screenSeat: {
          isActive: true,
        },
        OR: [
          { status: 'AVAILABLE' },
          {
            status: 'LOCKED',
            lockedUntil: {
              lt: new Date(),
            },
          },
        ],
      },
      include: {
        screenSeat: true,
      },
    });
  }

  async lockSeats(
    tx: Prisma.TransactionClient,
    showId: string,
    seatIds: string[],
    expiresAt: Date,
    changedBy = 'SYSTEM',
  ) {
    const result = await tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },
        showId,
        OR: [
          { status: 'AVAILABLE' },
          {
            status: 'LOCKED',
            lockedUntil: {
              lt: new Date(),
            },
          },
        ],
      },
      data: {
        status: 'LOCKED',
        lockedAt: new Date(),
        lockedUntil: expiresAt,
      },
    });

    if (result.count > 0) {
      await tx.showSeatHistory.createMany({
        data: seatIds.map((id) => ({
          showSeatId: id,
          oldStatus: 'AVAILABLE',
          newStatus: 'LOCKED',
          changedBy,
        })),
      });
    }

    return result;
  }

  async bookSeats(
    tx: Prisma.TransactionClient,
    showId: string,
    seatIds: string[],
    changedBy = 'SYSTEM',
  ) {
    const result = await tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },
        showId,
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

    if (result.count > 0) {
      await tx.showSeatHistory.createMany({
        data: seatIds.map((id) => ({
          showSeatId: id,
          oldStatus: 'LOCKED',
          newStatus: 'BOOKED',
          changedBy,
        })),
      });
    }

    return result;
  }

  async releaseSeats(
    tx: Prisma.TransactionClient,
    showId: string,
    seatIds: string[],
    changedBy = 'SYSTEM',
  ) {
    const result = await tx.showSeat.updateMany({
      where: {
        id: {
          in: seatIds,
        },
        showId,
        status: 'LOCKED',
      },
      data: {
        status: 'AVAILABLE',
        lockedAt: null,
        lockedUntil: null,
      },
    });

    if (result.count > 0) {
      await tx.showSeatHistory.createMany({
        data: seatIds.map((id) => ({
          showSeatId: id,
          oldStatus: 'LOCKED',
          newStatus: 'AVAILABLE',
          changedBy,
        })),
      });
    }

    return result;
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
