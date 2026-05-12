import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

import { BookingRepository } from './booking.repository';

import { SeatRepository } from '../seat/seat.repository';

@Injectable()
export class BookingExpirationService {
  private readonly logger = new Logger(BookingExpirationService.name);

  constructor(
    private readonly prisma: PrismaService,

    private readonly bookingRepository: BookingRepository,

    private readonly seatRepository: SeatRepository,
  ) {}

  @Cron('*/30 * * * * *')
  async releaseExpiredBookings() {
    const expiredBookings = await this.bookingRepository.findExpiredBookings();

    if (!expiredBookings.length) {
      return;
    }

    this.logger.log(`Found ${expiredBookings.length} expired bookings`);

    for (const booking of expiredBookings) {
      await this.prisma.$transaction(async (tx) => {
        const seatIds = booking.bookingSeats.map((seat) => seat.showSeatId);

        await this.seatRepository.releaseSeats(tx, seatIds);

        await this.bookingRepository.expireBooking(tx, booking.id);
      });

      this.logger.log(`Released booking ${booking.id}`);
    }
  }
}
