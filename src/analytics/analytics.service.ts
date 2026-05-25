import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAccessibleVenueIds(userId: string, role: string): Promise<string[] | null> {
    if (role === Role.SUPER_ADMIN || role === Role.ADMIN) {
      return null; // Null means they can access everything
    }

    if (role === Role.THEATER_MANAGER) {
      const userVenues = await this.prisma.userVenue.findMany({
        where: { userId },
      });
      if (!userVenues.length) {
        throw new ForbiddenException('You are not assigned to any venues.');
      }
      return userVenues.map(uv => uv.venueId);
    }

    throw new ForbiddenException('You do not have access to analytics.');
  }

  async getRevenue(userId: string, role: string) {
    const venueIds = await this.getAccessibleVenueIds(userId, role);

    const matchStage: any = {
      status: 'SUCCESS',
    };

    if (venueIds) {
      matchStage.booking = {
        show: {
          screen: {
            venueId: { in: venueIds },
          },
        },
      };
    }

    const aggregations = await this.prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      where: matchStage,
    });

    return {
      totalRevenue: aggregations._sum.amount || 0,
      totalSuccessfulTransactions: aggregations._count.id,
    };
  }

  async getTopEvents(userId: string, role: string) {
    const venueIds = await this.getAccessibleVenueIds(userId, role);

    const whereClause: any = {};
    if (venueIds) {
      whereClause.screen = {
        venueId: { in: venueIds },
      };
    }

    // We fetch all shows that match, and group bookings
    const shows = await this.prisma.show.findMany({
      where: whereClause,
      include: {
        event: true,
        bookings: {
          where: { bookingStatus: 'CONFIRMED' },
          include: { bookingSeats: true },
        },
      },
    });

    const eventStats: Record<string, { title: string; ticketsSold: number; revenue: number }> = {};

    shows.forEach(show => {
      const eventId = show.eventId;
      if (!eventStats[eventId]) {
        eventStats[eventId] = { title: show.event.title, ticketsSold: 0, revenue: 0 };
      }

      show.bookings.forEach(booking => {
        eventStats[eventId].ticketsSold += booking.bookingSeats.length;
        eventStats[eventId].revenue += Number(booking.totalAmount);
      });
    });

    return Object.values(eventStats).sort((a, b) => b.ticketsSold - a.ticketsSold);
  }
}
