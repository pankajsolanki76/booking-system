import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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

@Injectable()
export class BookingService extends BaseService<Booking> {
  constructor(
    private readonly prisma: PrismaService,

    private readonly bookingRepository: BookingRepository,

    private readonly seatRepository: SeatRepository,
  ) {
    super(bookingRepository);
  }

  async createBooking(
    userId: string,

    createBookingDto: CreateBookingDto,
  ) {
    const { showId, seatIds } = createBookingDto;

    if (new Set(seatIds).size !== seatIds.length) {
      throw new BadRequestException('Duplicate seats selected');
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const availableSeats = await this.seatRepository.findAvailableShowSeats(
        showId,
        seatIds,
      );

      if (availableSeats.length !== seatIds.length) {
        throw new BadRequestException('Some seats are unavailable');
      }

      const lockResult = await this.seatRepository.lockSeats(
        tx,
        seatIds,
        expiresAt,
      );

      if (lockResult.count !== seatIds.length) {
        throw new BadRequestException('Failed to lock seats');
      }

      const totalAmount = availableSeats.reduce(
        (sum, seat) => sum + Number(seat.screenSeat.price),
        0,
      );

      const booking = await this.bookingRepository.createBooking(tx, {
        userId,

        showId,

        totalAmount,

        expiresAt,
      });

      await this.bookingRepository.createBookingSeats(
        tx,

        availableSeats.map((seat) => ({
          bookingId: booking.id,

          showSeatId: seat.id,

          price: seat.screenSeat.price,
        })),
      );

      return {
        message: 'Seats locked successfully',

        bookingId: booking.id,

        expiresAt,
      };
    });
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
}

