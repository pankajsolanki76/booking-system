import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Booking } from '@prisma/client';
import { BaseService } from '../common/services/base.service';

import { PrismaService } from '../prisma/prisma.service';

import { CreateBookingDto } from './dto/create-booking.dto';

import { BookingRepository } from './booking.repository';

import { SeatRepository } from '../seat/seat.repository';
import { QueryBookingDto } from './dto/query-booking.dto';

import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';
import { TicketService } from '../ticket/ticket.service';
import { StripeService } from '../payment/stripe.service';
import { WaitlistService } from '../waitlist/waitlist.service';

@Injectable()
export class BookingService extends BaseService<Booking> {
  constructor(
    private readonly prisma: PrismaService,

    private readonly bookingRepository: BookingRepository,

    private readonly seatRepository: SeatRepository,

    private readonly ticketService: TicketService,

    private readonly stripeService: StripeService,

    private readonly waitlistService: WaitlistService,
  ) {
    super(bookingRepository);
  }

  async createBooking(
    userId: string,

    createBookingDto: CreateBookingDto,
  ) {
    const { showId, seatIds } = createBookingDto;

    if (seatIds.length > 6) {
      throw new BadRequestException('You can only book up to 6 seats at a time');
    }

    if (new Set(seatIds).size !== seatIds.length) {
      throw new BadRequestException('Duplicate seats selected');
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const availableSeats = await this.seatRepository.findAvailableShowSeats(
        showId,
        seatIds,
        tx,
      );

      if (availableSeats.length !== seatIds.length) {
        throw new BadRequestException('Some seats are unavailable');
      }

      const lockResult = await this.seatRepository.lockSeats(
        tx,
        showId,
        seatIds,
        expiresAt,
        `USER_${userId}`,
      );

      if (lockResult.count !== seatIds.length) {
        throw new BadRequestException('Failed to lock seats');
      }

      const baseAmount = availableSeats.reduce(
        (sum, seat) => sum + Number(seat.price),
        0,
      );
      const taxes = baseAmount * 0.10; // 10% tax
      const convenienceFee = 2.00 * availableSeats.length; // 2.00 per ticket
      const totalAmount = baseAmount + taxes + convenienceFee;

      const booking = await this.bookingRepository.createBooking(tx, {
        userId,

        showId,

        baseAmount,
        taxes,
        convenienceFee,
        totalAmount,

        expiresAt,
      });

      await this.bookingRepository.createBookingSeats(
        tx,

        availableSeats.map((seat) => ({
          bookingId: booking.id,

          showSeatId: seat.id,

          price: seat.price,
        })),
      );

      return {
        message: 'Seats locked successfully',

        bookingId: booking.id,

        expiresAt,
      };
    });

    // Transaction committed successfully, broadcast updates to clients
    this.seatRepository.seatUpdates$.next({
      showId,
      seatIds,
      status: 'LOCKED',
    });

    return result;
  }

  async getMyBookings(
    userId: string,

    queryDto: QueryBookingDto,
  ) {
    const {
      page = 1,

      limit = 10,

      sortBy = 'createdAt',

      sortOrder = 'desc',
    } = queryDto;

    const { skip, take } = buildPagination(page, limit);

    const result = await this.bookingRepository.findUserBookings({
      userId,

      where: {
        userId,
      },

      skip,

      take,

      orderBy: {
        [sortBy]: sortOrder,
      },

      include: {
        bookingSeats: {
          include: {
            showSeat: {
              include: {
                screenSeat: true,
              },
            },
          },
        },

        show: {
          include: {
            event: true,

            screen: {
              include: {
                venue: true,
              },
            },
          },
        },
      },
    });

    return createPaginatedResponse({
      data: result.data,

      total: result.total,

      page,

      limit,
    });
  }

  async getBookingById(
    bookingId: string,

    currentUser: any,
  ) {
    const booking = await this.findOne(bookingId); // BaseService.findOne throws NotFoundException

    const isOwner = booking.userId === currentUser.id;

    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string, userRole: string, seatIdsToCancel?: string[]) {
    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookingSeats: true,
          show: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Check authorization: must be owner or admin
      if (booking.userId !== userId && userRole !== 'ADMIN') {
        throw new ForbiddenException('You are not authorized to cancel this booking');
      }

      // Verify status
      if (booking.bookingStatus !== 'PENDING' && booking.bookingStatus !== 'CONFIRMED') {
        throw new BadRequestException(`Booking cannot be cancelled because its status is ${booking.bookingStatus}`);
      }

      let seatsToRelease = booking.bookingSeats.map((bs) => bs.showSeatId);
      let isPartial = false;

      if (seatIdsToCancel && seatIdsToCancel.length > 0) {
        const invalidSeats = seatIdsToCancel.filter(id => !seatsToRelease.includes(id));
        if (invalidSeats.length > 0) {
          throw new BadRequestException('Some specified seats do not belong to this booking');
        }
        seatsToRelease = seatIdsToCancel;
        isPartial = seatsToRelease.length < booking.bookingSeats.length;
      }

      let refundAmount = 0;
      let baseRefund = 0;
      
      if (isPartial) {
        const cancelledBookingSeats = booking.bookingSeats.filter(bs => seatsToRelease.includes(bs.showSeatId));
        baseRefund = cancelledBookingSeats.reduce((sum, bs) => sum + Number(bs.price), 0);
      } else {
        baseRefund = Number(booking.baseAmount);
      }
      
      const taxRefund = baseRefund * 0.10;
      let totalEligibleRefund = baseRefund + taxRefund;

      // Verify cancellation window and apply tiers
      if (userRole !== 'ADMIN') {
        const timeToShowMs = booking.show.startTime.getTime() - Date.now();
        const hoursToShow = timeToShowMs / (1000 * 60 * 60);

        if (hoursToShow < 12) {
           totalEligibleRefund = 0; // No refund < 12h
        } else if (hoursToShow < 24) {
           totalEligibleRefund = totalEligibleRefund * 0.5; // 50% refund between 12h and 24h
        } else {
           // 100% refund of base and tax if > 24h
        }
      } else {
        // Admin: verify show has not started yet
        if (booking.show.startTime <= new Date()) {
          throw new BadRequestException('Cannot cancel booking after the show has started');
        }
      }
      
      refundAmount = totalEligibleRefund;

      if (seatsToRelease.length > 0) {
        // Fetch current status of the seats for the history log
        const currentSeats = await tx.showSeat.findMany({
          where: {
            id: { in: seatsToRelease },
            showId: booking.showId,
          },
          select: { id: true, status: true },
        });

        // Update seats to AVAILABLE
        await tx.showSeat.updateMany({
          where: {
            id: { in: seatsToRelease },
            showId: booking.showId,
          },
          data: {
            status: 'AVAILABLE',
            lockedAt: null,
            lockedUntil: null,
            bookedAt: null,
          },
        });

        // Create history logs
        await tx.showSeatHistory.createMany({
          data: currentSeats.map((seat) => ({
            showSeatId: seat.id,
            oldStatus: seat.status,
            newStatus: 'AVAILABLE',
            changedBy: `USER_CANCEL_${userId}`,
          })),
        });
      }

      let paymentStatusUpdate = booking.paymentStatus;
      if (booking.paymentStatus === 'SUCCESS') {
        if (!isPartial) paymentStatusUpdate = 'REFUNDED';
        
        const payment = await tx.payment.findUnique({
          where: { bookingId },
        });

        if (payment && payment.transactionRef) {
          await this.stripeService.createRefund(payment.transactionRef, refundAmount);
          
          if (!isPartial) {
            await tx.payment.update({
              where: { bookingId },
              data: {
                status: 'REFUNDED',
              },
            });
          }
        }
      } else if (booking.paymentStatus === 'PENDING') {
        if (!isPartial) paymentStatusUpdate = 'FAILED';
      }

      let updatedBooking;
      
      if (!isPartial) {
        // Update booking status
        updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            bookingStatus: 'CANCELLED',
            paymentStatus: paymentStatusUpdate,
          },
        });
      } else {
        // Update booking totalAmount for partial cancel
        updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            totalAmount: Number(booking.totalAmount) - refundAmount,
          },
        });
        
        // Remove specific booking seat records
        await tx.bookingSeat.deleteMany({
          where: {
            bookingId,
            showSeatId: { in: seatsToRelease }
          }
        });
      }

      return {
        showId: booking.showId,
        seatIds: seatsToRelease,
        updatedBooking,
      };
    });

    // Broadcast update to SSE stream
    if (result.seatIds.length > 0) {
      this.seatRepository.seatUpdates$.next({
        showId: result.showId,
        seatIds: result.seatIds,
        status: 'AVAILABLE',
      });
      // Notify waitlist
      this.waitlistService.notifyNextUser(result.showId).catch(err => console.error(err));
    }

    return {
      message: 'Booking cancelled successfully',
      booking: result.updatedBooking,
    };
  }

  override async remove(id: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: {
          bookingSeats: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const seatIds = booking.bookingSeats.map((bs) => bs.showSeatId);

      if (seatIds.length > 0) {
        // Fetch current status of seats
        const currentSeats = await tx.showSeat.findMany({
          where: {
            id: { in: seatIds },
            showId: booking.showId,
          },
          select: { id: true, status: true },
        });

        // Release seats
        await tx.showSeat.updateMany({
          where: {
            id: { in: seatIds },
            showId: booking.showId,
          },
          data: {
            status: 'AVAILABLE',
            lockedAt: null,
            lockedUntil: null,
            bookedAt: null,
          },
        });

        // Log history
        await tx.showSeatHistory.createMany({
          data: currentSeats.map((seat) => ({
            showSeatId: seat.id,
            oldStatus: seat.status,
            newStatus: 'AVAILABLE',
            changedBy: 'ADMIN_DELETE',
          })),
        });
      }

      if (booking.paymentStatus === 'SUCCESS') {
        const payment = await tx.payment.findUnique({
          where: { bookingId: id },
        });
        if (payment && payment.transactionRef) {
          await this.stripeService.createRefund(payment.transactionRef, Number(booking.totalAmount));
        }
      }

      // Delete relation booking seat links first
      await tx.bookingSeat.deleteMany({
        where: { bookingId: id },
      });

      // Delete payment if any
      await tx.payment.deleteMany({
        where: { bookingId: id },
      });

      // Hard delete booking
      await tx.booking.delete({
        where: { id: id },
      });

      return {
        showId: booking.showId,
        seatIds,
      };
    });

    // Broadcast update to SSE stream
    if (result.seatIds.length > 0) {
      this.seatRepository.seatUpdates$.next({
        showId: result.showId,
        seatIds: result.seatIds,
        status: 'AVAILABLE',
      });
    }

    return {
      message: 'Booking deleted successfully and seats released',
    };
  }

  async getTicketDetails(bookingId: string, currentUser: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        show: {
          include: {
            event: true,
            screen: {
              include: {
                venue: true,
              },
            },
          },
        },
        payment: true,
        bookingSeats: {
          include: {
            showSeat: {
              include: {
                screenSeat: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.bookingStatus !== 'CONFIRMED') {
      throw new BadRequestException('Ticket is only available for confirmed bookings');
    }

    const isOwner = booking.userId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const qrCodeUrl = await this.ticketService.generateQrCode(booking.id);

    return {
      bookingId: booking.id,
      eventTitle: booking.show?.event?.title || 'Unknown Event',
      venueName: booking.show?.screen?.venue?.name || 'Unknown Venue',
      screenName: booking.show?.screen?.name || 'Unknown Screen',
      startTime: booking.show?.startTime || null,
      seats: booking.bookingSeats?.map((bs: any) => {
        const row = bs.showSeat?.screenSeat?.rowLabel || '';
        const num = bs.showSeat?.screenSeat?.seatNumber || '';
        return `${row}${num}`;
      }) || [],
      totalAmount: booking.totalAmount,
      paymentRef: booking.payment?.transactionRef || 'N/A',
      qrCode: qrCodeUrl,
      checkedInAt: booking.checkedInAt,
    };
  }

  async verifyTicket(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        show: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.bookingStatus !== 'CONFIRMED') {
      throw new BadRequestException('Ticket is not confirmed');
    }

    if (booking.checkedInAt) {
      throw new BadRequestException('Ticket already checked in');
    }

    if (new Date() > booking.show.endTime) {
      throw new BadRequestException('Show has already ended');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkedInAt: new Date(),
      },
    });

    return {
      message: 'Check-in successful',
      bookingId: updatedBooking.id,
      checkedInAt: updatedBooking.checkedInAt,
    };
  }
}
