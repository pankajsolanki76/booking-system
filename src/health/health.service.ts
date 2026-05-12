import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    await this.prisma.$queryRaw<number[]>`SELECT 1`;

    return {
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
