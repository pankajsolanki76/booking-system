import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { BookingRepository } from '../booking/booking.repository';

import { PaymentRepository } from './payment.repository';

import { SeatRepository } from '../seat/seat.repository';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly bookingRepository: BookingRepository,

    private readonly paymentRepository: PaymentRepository,

    private readonly seatRepository: SeatRepository,
  ) {}

  async processPayment(
    bookingId: string,

    simulateSuccess: boolean,
  ) {
    const booking = await this.bookingRepository.findBookingById(bookingId);

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.bookingStatus !== 'PENDING') {
      throw new BadRequestException('Booking already processed');
    }

    if (new Date() > booking.expiresAt) {
      throw new BadRequestException('Booking lock expired');
    }

    return this.prisma.$transaction(async (tx) => {
      const seatIds = booking.bookingSeats.map((seat) => seat.showSeatId);

      if (simulateSuccess) {
        await this.seatRepository.bookSeats(tx, seatIds);

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

          transactionRef: `TXN-${Date.now()}`,
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

      throw new BadRequestException('Payment failed');
    });
  }
}
