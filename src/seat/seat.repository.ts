import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SeatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createScreenSeat(data: any) {
    return this.prisma.screenSeat.create({
      data,
    });
  }

  async findScreenSeatById(id: string) {
    return this.prisma.screenSeat.findUnique({
      where: { id },
    });
  }

  async createShowSeats(data: any[]) {
    return this.prisma.showSeat.createMany({
      data,
    });
  }

  async findShowSeats(showId: string) {
    return this.prisma.showSeat.findMany({
      where: { showId },

      include: {
        screenSeat: true,
      },
    });
  }
}
