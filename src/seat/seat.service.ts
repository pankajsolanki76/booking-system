import { BadRequestException, Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Prisma, ScreenSeat } from '@prisma/client';

import { BaseService } from '../common/services/base.service';

import { ScreenRepository } from '../screen/screen.repository';

import { CreateScreenSeatDto } from './dto/create-screen-seat.dto';
import { BulkCreateScreenSeatDto } from './dto/bulk-create-screen-seat.dto';

import { SeatRepository } from './seat.repository';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeatService extends BaseService<ScreenSeat> {
  constructor(
    private readonly seatRepository: SeatRepository,

    private readonly screenRepository: ScreenRepository,

    private readonly prisma: PrismaService,
  ) {
    super(seatRepository);
  }

  /**
   * Create screen seat
   */
  async createScreenSeat(createSeatDto: CreateScreenSeatDto) {
    /**
     * Validate screen
     */
    const screen = await this.screenRepository.findById(createSeatDto.screenId);

    if (!screen) {
      throw new BadRequestException('Invalid screen');
    }

    /**
     * Normalize values
     */
    const rowLabel = createSeatDto.rowLabel.trim().toUpperCase();

    const seatNumber = createSeatDto.seatNumber;

    /**
     * Prevent duplicate seats
     */
    const existingSeat = await this.seatRepository.findSeatByNumber(
      createSeatDto.screenId,

      rowLabel,

      seatNumber,
    );

    if (existingSeat) {
      throw new BadRequestException('Seat already exists in this screen');
    }

    return this.seatRepository.createScreenSeat({
      ...createSeatDto,

      rowLabel,

      seatNumber,
    });
  }

  /**
   * Bulk create screen seats for a row
   */
  async bulkCreateScreenSeats(bulkDto: BulkCreateScreenSeatDto) {
    const screen = await this.screenRepository.findById(bulkDto.screenId);

    if (!screen) {
      throw new BadRequestException('Invalid screen');
    }

    const rowLabel = bulkDto.rowLabel.trim().toUpperCase();
    const seatsToCreate: Prisma.ScreenSeatCreateManyInput[] = [];

    for (let i = 1; i <= bulkDto.numberOfSeats; i++) {
      seatsToCreate.push({
        screenId: bulkDto.screenId,
        rowLabel,
        seatNumber: i,
        price: bulkDto.basePrice,
        type: bulkDto.type,
      });
    }

    try {
      const result = await this.prisma.screenSeat.createMany({
        data: seatsToCreate,
        skipDuplicates: true,
      });

      return {
        message: `Successfully created ${result.count} seats for row ${rowLabel}`,
        count: result.count,
      };
    } catch (error) {
      throw new BadRequestException('Failed to bulk create seats');
    }
  }

  /**
   * Get seats for show
   */
  async getShowSeats(showId: string) {
    return this.seatRepository.findShowSeats(showId);
  }

  /**
   * Deactivate seat
   */
  async deactivateSeat(id: string) {
    const seat = await this.seatRepository.findById(id);

    if (!seat) {
      throw new BadRequestException('Seat not found');
    }

    if (!seat.isActive) {
      throw new BadRequestException('Seat already inactive');
    }

    // Check if there are active locks or confirmed bookings in future/active shows
    const activeBookingOrLock = await this.prisma.showSeat.findFirst({
      where: {
        screenSeatId: id,
        status: {
          in: ['LOCKED', 'BOOKED'],
        },
        show: {
          isDeleted: false,
          endTime: {
            gt: new Date(),
          },
        },
      },
    });

    if (activeBookingOrLock) {
      throw new BadRequestException(
        'Cannot deactivate seat as it has active locks or confirmed bookings for future shows',
      );
    }

    await this.seatRepository.deactivateSeat(id);

    return {
      message: 'Seat deactivated successfully',
    };
  }

  /**
   * Activate seat
   */
  async activateSeat(id: string) {
    const seat = await this.seatRepository.findById(id);

    if (!seat) {
      throw new BadRequestException('Seat not found');
    }

    if (seat.isActive) {
      throw new BadRequestException('Seat already active');
    }

    await this.seatRepository.activateSeat(id);

    return {
      message: 'Seat activated successfully',
    };
  }

  /**
   * Get real-time seat update stream for a show (SSE)
   */
  getShowSeatUpdates(showId: string): Observable<MessageEvent> {
    return this.seatRepository.seatUpdates$.asObservable().pipe(
      filter((event) => event.showId === showId),
      map((event) => ({
        data: {
          seatIds: event.seatIds,
          status: event.status,
        },
      } as MessageEvent)),
    );
  }
}
