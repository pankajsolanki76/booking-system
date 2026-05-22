import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { Payment } from '@prisma/client';

import { BaseService } from '../common/services/base.service';

import { PrismaService } from '../prisma/prisma.service';

import { BookingRepository } from '../booking/booking.repository';

import { PaymentRepository } from './payment.repository';

import { SeatRepository } from '../seat/seat.repository';
import { TicketService } from '../ticket/ticket.service';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentService extends BaseService<Payment> {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,

    private readonly bookingRepository: BookingRepository,

    private readonly paymentRepository: PaymentRepository,

    private readonly seatRepository: SeatRepository,

    private readonly ticketService: TicketService,

    private readonly stripeService: StripeService,
  ) {
    super(paymentRepository);
  }

  async processPayment(
    bookingId: string,

    simulateSuccess: boolean,

    userId: string,
  ) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const booking = await this.bookingRepository.findBookingById(
          tx,
          bookingId,
        );

        if (!booking) {
          throw new BadRequestException('Booking not found');
        }

        if (booking.userId !== userId) {
          throw new ForbiddenException(
            'You are not allowed to process this booking',
          );
        }

        const existingPayment = await this.paymentRepository.existingPayment(
          tx,
          booking.id,
        );

        if (existingPayment) {
          return {
            alreadyProcessed: true,
            response: {
              message: 'Payment already processed',

              bookingId: booking.id,

              paymentStatus: existingPayment.status,
            },
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
          const bookResult = await this.seatRepository.bookSeats(
            tx,
            booking.showId,
            seatIds,
            `USER_${userId}`,
          );

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
            success: true,
            showId: booking.showId,
            seatIds,
            response: {
              message: 'Payment successful',

              bookingId: booking.id,
            },
          };
        }

        await this.seatRepository.releaseSeats(
          tx,
          booking.showId,
          seatIds,
          `USER_${userId}_PAYMENT_FAIL`,
        );

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
          success: false,
          showId: booking.showId,
          seatIds,
          response: {
            message: 'Payment failed',

            bookingId: booking.id,
          },
        };
      },

      {
        timeout: 10000,
      },
    );

    // Transaction committed successfully, broadcast updates to clients
    if (
      result &&
      'showId' in result &&
      'seatIds' in result &&
      result.showId &&
      result.seatIds
    ) {
      this.seatRepository.seatUpdates$.next({
        showId: result.showId as string,
        seatIds: result.seatIds as string[],
        status: result.success ? 'BOOKED' : 'AVAILABLE',
      });

      if (result.success) {
        // Dispatch the ticket asynchronously
        this.ticketService.dispatchTicket(bookingId).catch(() => {});
      }
    }

    return result.response;
  }

  async createCheckoutSession(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        show: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('You are not allowed to pay for this booking');
    }

    if (booking.bookingStatus !== 'PENDING') {
      throw new BadRequestException(`Booking already processed (status: ${booking.bookingStatus})`);
    }

    if (new Date() > booking.expiresAt) {
      throw new BadRequestException('Booking lock expired');
    }

    const eventTitle = booking.show?.event?.title || 'Event Ticket';
    const amount = Number(booking.totalAmount);

    return this.stripeService.createCheckoutSession(
      booking.id,
      amount,
      eventTitle,
      userId,
    );
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: any;
    try {
      event = this.stripeService.verifyWebhook(rawBody, signature);
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      const transactionRef = session.payment_intent || session.id;

      if (!bookingId) {
        throw new BadRequestException('No bookingId in session metadata');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { bookingSeats: true },
        });

        if (!booking) {
          throw new BadRequestException(`Booking not found: ${bookingId}`);
        }

        if (booking.bookingStatus === 'CONFIRMED') {
          return { success: false, alreadyConfirmed: true };
        }

        if (booking.bookingStatus !== 'PENDING') {
          throw new BadRequestException(`Booking status is ${booking.bookingStatus}, cannot confirm`);
        }

        const seatIds = booking.bookingSeats.map((seat) => seat.showSeatId);

        try {
          const bookResult = await this.seatRepository.bookSeats(
            tx,
            booking.showId,
            seatIds,
            `USER_${booking.userId}`,
          );

          if (bookResult.count !== seatIds.length) {
            throw new Error('Seats no longer available or already taken');
          }

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              bookingStatus: 'CONFIRMED',
              paymentStatus: 'SUCCESS',
              confirmedAt: new Date(),
            },
          });

          await tx.payment.upsert({
            where: { bookingId: booking.id },
            create: {
              bookingId: booking.id,
              amount: booking.totalAmount,
              status: 'SUCCESS',
              paidAt: new Date(),
              transactionRef,
            },
            update: {
              status: 'SUCCESS',
              paidAt: new Date(),
              transactionRef,
            },
          });

          return { success: true, showId: booking.showId, seatIds, bookingId: booking.id };
        } catch (error: any) {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              bookingStatus: 'CANCELLED',
              paymentStatus: 'FAILED',
            },
          });

          await tx.payment.upsert({
            where: { bookingId: booking.id },
            create: {
              bookingId: booking.id,
              amount: booking.totalAmount,
              status: 'FAILED',
              transactionRef,
            },
            update: {
              status: 'FAILED',
              transactionRef,
            },
          });

          this.stripeService.createRefund(transactionRef, Number(booking.totalAmount)).catch((err) => {
            this.logger.error(`Automated refund for failed booking ${booking.id} failed: ${err.message}`);
          });

          throw new BadRequestException(`Fulfillment failed: ${error.message}. Automatic refund initiated.`);
        }
      });

      if (result && result.success && result.showId && result.seatIds && result.bookingId) {
        this.seatRepository.seatUpdates$.next({
          showId: result.showId,
          seatIds: result.seatIds,
          status: 'BOOKED',
        });

        this.ticketService.dispatchTicket(result.bookingId).catch(() => {});
      }
    }

    return { received: true };
  }

  async getBookingForMock(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        show: {
          include: {
            event: true,
          },
        },
      },
    });
  }

  async cancelPendingBooking(bookingId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { bookingSeats: true },
      });

      if (!booking) {
        throw new BadRequestException('Booking not found');
      }

      if (booking.bookingStatus !== 'PENDING') {
        return { message: 'Booking is not in PENDING state' };
      }

      const seatIds = booking.bookingSeats.map((seat) => seat.showSeatId);

      await this.seatRepository.releaseSeats(
        tx,
        booking.showId,
        seatIds,
        `MOCK_CHECKOUT_CANCEL`,
      );

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });

      await tx.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          status: 'FAILED',
          transactionRef: 'MOCK_CANCEL',
        },
        update: {
          status: 'FAILED',
          transactionRef: 'MOCK_CANCEL',
        },
      });

      this.seatRepository.seatUpdates$.next({
        showId: booking.showId,
        seatIds,
        status: 'AVAILABLE',
      });

      return { success: true };
    });
  }
}
