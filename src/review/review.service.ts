import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { eventId, rating, comment } = createReviewDto;

    const validBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        bookingStatus: BookingStatus.CONFIRMED,
        checkedInAt: {
          not: null,
        },
        show: {
          eventId: eventId,
        },
      },
    });

    if (!validBooking) {
      throw new BadRequestException(
        'You can only review an event if you have a confirmed booking and have checked in.',
      );
    }

    const review = await this.prisma.review.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId,
        eventId,
        rating,
        comment,
      },
    });

    return review;
  }

  async getReviewsByEvent(eventId: string, skip: number = 0, take: number = 10) {
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { eventId },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.review.count({
        where: { eventId },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        skip,
        take,
      },
    };
  }
}
