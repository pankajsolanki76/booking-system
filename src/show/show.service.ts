import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Show, Prisma } from '@prisma/client';

import { BaseService } from '../common/services/base.service';

import { CreateShowDto } from './dto/create-show.dto';

import { ShowRepository } from './show.repository';

import { EventRepository } from '../event/event.repository';

import { ScreenRepository } from '../screen/screen.repository';

import { SeatRepository } from '../seat/seat.repository';

import { QueryShowDto } from './dto/query-show.dto';

import { buildPagination } from '../common/utils/pagination.util';

import { createPaginatedResponse } from '../common/utils/paginated-response.util';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShowService extends BaseService<Show> {
  constructor(
    private readonly prisma: PrismaService,

    private readonly showRepository: ShowRepository,

    private readonly eventRepository: EventRepository,

    private readonly screenRepository: ScreenRepository,

    private readonly seatRepository: SeatRepository,
  ) {
    super(showRepository);
  }

  override async create(createShowDto: CreateShowDto) {
    const startTime = new Date(createShowDto.startTime);

    const endTime = new Date(createShowDto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (startTime <= new Date()) {
      throw new BadRequestException('Show start time must be in the future');
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const event = await tx.event.findFirst({
            where: { id: createShowDto.eventId, isDeleted: false },
          });

          if (!event) {
            throw new BadRequestException('Invalid event');
          }

          const screen = await tx.screen.findUnique({
            where: { id: createShowDto.screenId },
          });

          if (!screen) {
            throw new BadRequestException('Invalid screen');
          }

          const overlappingShow = await this.showRepository.findOverlappingShow(
            {
              screenId: createShowDto.screenId,
              startTime,
              endTime,
            },
            tx,
          );

          if (overlappingShow) {
            throw new BadRequestException(
              'Screen already has another show scheduled during this time',
            );
          }

          const show = await tx.show.create({
            data: {
              eventId: createShowDto.eventId,
              screenId: createShowDto.screenId,
              startTime,
              endTime,
              availableSeats: screen.totalSeats,
            },
          });

          const screenSeats = await tx.screenSeat.findMany({
            where: {
              screenId: screen.id,
              isActive: true,
            },
          });

          await tx.showSeat.createMany({
            data: screenSeats.map((seat) => {
              let seatPrice = Number(seat.price);
              if (createShowDto.priceMultiplier !== undefined) {
                seatPrice *= createShowDto.priceMultiplier;
              }
              if (createShowDto.customPrices) {
                const override = createShowDto.customPrices.find(
                  (cp) => cp.rowLabel.trim().toUpperCase() === seat.rowLabel.trim().toUpperCase(),
                );
                if (override) {
                  seatPrice = override.price;
                }
              }
              return {
                showId: show.id,
                screenSeatId: seat.id,
                price: new Prisma.Decimal(seatPrice),
              };
            }),
          });

          return show;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new BadRequestException(
          'A concurrency conflict occurred. Please try scheduling again.',
        );
      }
      throw error;
    }
  }

  override async findAll(queryDto: QueryShowDto) {
    const {
      page = 1,

      limit = 10,

      sortBy = 'startTime',

      sortOrder = 'asc',

      eventId,
    } = queryDto;

    const safeLimit = Math.min(limit, 50);

    const allowedSortFields = [
      'startTime',
      'endTime',
      'createdAt',
      'updatedAt',
    ];

    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'startTime';

    const { skip, take } = buildPagination(page, safeLimit);

    const where: Prisma.ShowWhereInput = {};

    if (eventId) {
      where.eventId = eventId;
    }

    const result = await this.showRepository.findAllShows({
      where,

      skip,

      take,

      orderBy: {
        [finalSortBy]: sortOrder,
      },

      include: {
        event: true,

        screen: {
          include: {
            venue: true,
          },
        },
      },
    });

    return createPaginatedResponse({
      data: result.data,

      total: result.total,

      page,

      limit: safeLimit,
    });
  }

  override async update(
    id: string,

    data: any,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const existingShow = await tx.show.findFirst({
            where: {
              id,
              isDeleted: false,
            },
            include: {
              bookings: true,
            },
          });

          if (!existingShow) {
            throw new NotFoundException('Show not found');
          }

          // 1. Prevent updating past shows
          if (existingShow.startTime <= new Date()) {
            throw new BadRequestException('Cannot update a show that has already started or ended');
          }

          // 2. Prevent setting new start time in the past
          if (data.startTime && new Date(data.startTime) <= new Date()) {
            throw new BadRequestException('New show start time must be in the future');
          }

          const hasBookings = existingShow.bookings.some(
            (booking) =>
              booking.bookingStatus === 'CONFIRMED' ||
              booking.bookingStatus === 'PENDING',
          );

          const isTimeChanged = (data.startTime && new Date(data.startTime).getTime() !== existingShow.startTime.getTime()) ||
                                (data.endTime && new Date(data.endTime).getTime() !== existingShow.endTime.getTime());
          const isScreenChanged = data.screenId && data.screenId !== existingShow.screenId;

          if (hasBookings && (isTimeChanged || isScreenChanged)) {
            throw new BadRequestException('Cannot update show time or screen when active bookings exist');
          }

          const startTime = data.startTime
            ? new Date(data.startTime)
            : existingShow.startTime;

          const endTime = data.endTime
            ? new Date(data.endTime)
            : existingShow.endTime;

          if (endTime <= startTime) {
            throw new BadRequestException('End time must be after start time');
          }

          const screenId = data.screenId || existingShow.screenId;
          const overlappingShow = await this.showRepository.findOverlappingShow(
            {
              screenId,
              startTime,
              endTime,
              excludeShowId: id,
            },
            tx,
          );

          if (overlappingShow) {
            throw new BadRequestException(
              'Screen already has another show scheduled during this time',
            );
          }

          const { priceMultiplier, customPrices, ...showData } = data;

          if (priceMultiplier !== undefined || customPrices !== undefined) {
            const screenSeats = await tx.screenSeat.findMany({
              where: {
                screenId,
                isActive: true,
              },
            });

            for (const seat of screenSeats) {
              let seatPrice = Number(seat.price);
              if (priceMultiplier !== undefined) {
                seatPrice *= priceMultiplier;
              }
              if (customPrices) {
                const override = customPrices.find(
                  (cp: any) => cp.rowLabel.trim().toUpperCase() === seat.rowLabel.trim().toUpperCase(),
                );
                if (override) {
                  seatPrice = override.price;
                }
              }

              await tx.showSeat.updateMany({
                where: {
                  showId: id,
                  screenSeatId: seat.id,
                  status: {
                    in: ['AVAILABLE', 'LOCKED'],
                  },
                },
                data: {
                  price: new Prisma.Decimal(seatPrice),
                },
              });
            }
          }

          return tx.show.update({
            where: { id },
            data: {
              ...showData,
              startTime,
              endTime,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new BadRequestException(
          'A concurrency conflict occurred. Please try updating again.',
        );
      }
      throw error;
    }
  }
  override async remove(id: string): Promise<any> {
    const show = await this.showRepository.findById(id);

    if (!show) {
      throw new NotFoundException('Show not found');
    }

    /**
     * Prevent deleting shows
     * with active bookings
     */
    const hasBookings = show.bookings.some(
      (booking) =>
        booking.bookingStatus === 'CONFIRMED' ||
        booking.bookingStatus === 'PENDING',
    );

    if (hasBookings) {
      throw new BadRequestException('Cannot delete show with active bookings');
    }

    await this.showRepository.softDelete(id);

    return {
      message: 'Show deleted successfully',
    };
  }
  async restore(id: string) {
    const deletedShow = await this.showRepository.findDeletedById(id);

    if (!deletedShow) {
      throw new NotFoundException('Deleted show not found');
    }

    /**
     * Prevent restoring past shows
     */
    if (deletedShow.endTime < new Date()) {
      throw new BadRequestException('Cannot restore past shows');
    }

    /**
     * Prevent overlap conflicts
     */
    const overlappingShow = await this.showRepository.findOverlappingShow({
      screenId: deletedShow.screenId,

      startTime: deletedShow.startTime,

      endTime: deletedShow.endTime,
    });

    if (overlappingShow) {
      throw new BadRequestException(
        'Cannot restore show because another overlapping show exists',
      );
    }

    await this.showRepository.restore(id);

    return {
      message: 'Show restored successfully',
    };
  }
}
