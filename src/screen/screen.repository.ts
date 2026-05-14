import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { Screen } from '@prisma/client';

@Injectable()
export class ScreenRepository extends PrismaBaseRepository<Screen> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.screen);
  }

  override async findById(id: string) {
    return super.findById(id, {
      venue: true,
    });
  }

  async findAllScreens() {
    return this.findMany({
      include: {
        venue: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSeats(screenId: string) {
    return this.prisma.screenSeat.findMany({
      where: { screenId },
    });
  }
}

