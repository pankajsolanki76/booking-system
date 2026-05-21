import { BadRequestException, Injectable } from '@nestjs/common';

import { randomUUID } from 'crypto';

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
    return this.prisma.$transaction(
      async (tx) => {
        const booking = await this.bookingRepository.findBookingById(
          tx,
          bookingId,
        );

        if (!booking) {
          throw new BadRequestException('Booking not found');
        }
        /**
         * Prevent duplicate payment processing
         */
        const existingPayment = await this.paymentRepository.existingPayment(
          tx,
          booking.id,
        );

        if (existingPayment) {
          return {
            message: 'Payment already processed',

            bookingId: booking.id,

            paymentStatus: existingPayment.status,
          };
        }

        if (booking.bookingStatus !== 'PENDING') {
          throw new BadRequestException('Booking already processed');
        }

        if (new Date() > booking.expiresAt) {
          throw new BadRequestException('Booking lock expired');
        }

        const seatIds = booking.bookingSeats.map((seat) => seat.showSeatId);

        if (simulateSuccess) {
          const bookResult = await this.seatRepository.bookSeats(tx, seatIds);

          if (bookResult.count !== seatIds.length) {
            throw new BadRequestException('Some seats are no longer available');
          }

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

          await this.paymentRepository.createPayment(tx, {
            bookingId: booking.id,

            amount: booking.totalAmount,

            status: 'SUCCESS',

            paidAt: new Date(),

            transactionRef: randomUUID(),
          });

          return {
            message: 'Payment successful',

            bookingId: booking.id,
          };
        }

        await this.seatRepository.releaseSeats(tx, seatIds);

        await tx.booking.update({
          where: {
            id: booking.id,
          },

          data: {
            bookingStatus: 'CANCELLED',

            paymentStatus: 'FAILED',
          },
        });

        await this.paymentRepository.createPayment(tx, {
          bookingId: booking.id,

          amount: booking.totalAmount,

          status: 'FAILED',
        });

        return {
          message: 'Payment failed',

          bookingId: booking.id,
        };
      },

      {
        timeout: 10000,
      },
    );
  }
}
