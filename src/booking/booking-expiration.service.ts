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

  /**
   * Runs every 30 seconds
   */
  @Cron('*/30 * * * * *')
  async releaseExpiredBookings(): Promise<void> {
    try {
      /**
       * Find expired bookings
       */
      const expiredBookings =
        await this.bookingRepository.findExpiredBookings();

      if (!expiredBookings.length) {
        return;
      }

      this.logger.log(`Found ${expiredBookings.length} expired bookings`);

      /**
       * Process bookings sequentially
       * safer for DB locking
       */
      for (const booking of expiredBookings) {
        try {
          await this.prisma.$transaction(async (tx) => {
            /**
             * IMPORTANT:
             * Re-fetch latest booking state
             * INSIDE transaction
             */
            const currentBooking = await this.bookingRepository.findBookingById(
              tx,
              booking.id,
            );

            /**
             * Booking deleted meanwhile
             */
            if (!currentBooking) {
              return;
            }

            /**
             * Skip already processed bookings
             */
            if (
              currentBooking.bookingStatus === 'EXPIRED' ||
              currentBooking.bookingStatus === 'CONFIRMED' ||
              currentBooking.bookingStatus === 'CANCELLED'
            ) {
              return;
            }

            /**
             * Double-check expiry inside transaction
             */
            if (new Date() < currentBooking.expiresAt) {
              return;
            }

            /**
             * Extract seat IDs
             */
            const seatIds = currentBooking.bookingSeats.map(
              (seat) => seat.showSeatId,
            );

            /**
             * Release locked seats
             */
            await this.seatRepository.releaseSeats(tx, seatIds);

            /**
             * Mark booking expired
             */
            await this.bookingRepository.expireBooking(tx, currentBooking.id);

            this.logger.log(`Released expired booking ${currentBooking.id}`);
          });
        } catch (error: unknown) {
          /**
           * Safe unknown error handling
           */
          if (error instanceof Error) {
            this.logger.error(
              `Failed to release booking ${booking.id}: ${error.message}`,
              error.stack,
            );
          } else {
            this.logger.error(
              `Failed to release booking ${booking.id}: Unknown error`,
            );
          }
        }
      }
    } catch (error: unknown) {
      /**
       * Global cron failure handling
       */
      if (error instanceof Error) {
        this.logger.error(
          `Booking expiration cron job failed: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'Booking expiration cron job failed with unknown error',
        );
      }
    }
  }
}
