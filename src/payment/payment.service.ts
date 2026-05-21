import { BadRequestException, Injectable } from '@nestjs/common';

import { Payment } from '@prisma/client';

import { BaseService } from '../common/services/base.service';

import { PrismaService } from '../prisma/prisma.service';

import { BookingRepository } from '../booking/booking.repository';

import { PaymentRepository } from './payment.repository';

import { SeatRepository } from '../seat/seat.repository';

@Injectable()
export class PaymentService extends BaseService<Payment> {
  constructor(
    private readonly prisma: PrismaService,

    private readonly bookingRepository: BookingRepository,

    private readonly paymentRepository: PaymentRepository,

    private readonly seatRepository: SeatRepository,
  ) {
    super(paymentRepository);
  }

  async processPayment(
    bookingId: string,

    simulateSuccess: boolean,
  ) {
    return this.prisma.$transaction(async (tx) => {
      /**
       * IMPORTANT:
       * Fetch latest booking INSIDE transaction
       */
      const booking = await this.bookingRepository.findBookingById(
        tx,
        bookingId,
      );

      /**
       * Booking not found
       */
      if (!booking) {
        throw new BadRequestException('Booking not found');
      }

      /**
       * Already processed
       */
      if (booking.bookingStatus !== 'PENDING') {
        throw new BadRequestException('Booking already processed');
      }

      /**
       * Expiry check INSIDE transaction
       * Prevents race conditions
       */
      if (new Date() > booking.expiresAt) {
        throw new BadRequestException('Booking lock expired');
      }

      const seatIds = booking.bookingSeats.map((seat) => seat.showSeatId);

      /**
       * Payment Success
       */
      if (simulateSuccess) {
        /**
         * Mark seats booked
         */
        await this.seatRepository.bookSeats(tx, seatIds);

        /**
         * Update booking
         */
        await tx.booking.update({
          where: {
            id: booking.id,
          },

          data: {
            bookingStatus: 'CONFIRMED',

            paymentStatus: 'SUCCESS',

            confirmedAt: new Date(),
          },
        });

        /**
         * Create payment record
         */
        await this.paymentRepository.createPayment(tx, {
          bookingId: booking.id,

          amount: booking.totalAmount,

          status: 'SUCCESS',

          paidAt: new Date(),

          transactionRef: `TXN-${Date.now()}`,
        });

        return {
          message: 'Payment successful',

          bookingId: booking.id,
        };
      }

      /**
       * Payment failed
       * Release seats
       */
      await this.seatRepository.releaseSeats(tx, seatIds);

      /**
       * Update booking
       */
      await tx.booking.update({
        where: {
          id: booking.id,
        },

        data: {
          bookingStatus: 'CANCELLED',

          paymentStatus: 'FAILED',
        },
      });

      /**
       * Create failed payment record
       */
      await this.paymentRepository.createPayment(tx, {
        bookingId: booking.id,

        amount: booking.totalAmount,

        status: 'FAILED',
      });

      throw new BadRequestException('Payment failed');
    });
  }
}
