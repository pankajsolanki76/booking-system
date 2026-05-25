import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(private prisma: PrismaService) {}

  async joinWaitlist(userId: string, showId: string) {
    return this.prisma.waitlist.create({
      data: {
        userId,
        showId,
        status: 'PENDING',
      },
    });
  }

  async notifyNextUser(showId: string) {
    const oldestPending = await this.prisma.waitlist.findFirst({
      where: {
        showId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (oldestPending) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      await this.prisma.waitlist.update({
        where: { id: oldestPending.id },
        data: { 
          status: 'NOTIFIED',
          notifiedAt: new Date(),
          claimExpiresAt: expiresAt
        },
      });
      
      // Mock sending email
      this.logger.log(`[MOCK EMAIL] Hi user ${oldestPending.userId}, a seat opened up for show ${showId}! You have 15 minutes to claim it before it goes to the next person.`);
      
      this.logger.log(`Notified user ${oldestPending.userId} for show ${showId}`);
    }
  }

  @Cron('*/30 * * * * *')
  async checkWaitlistExpirations() {
    const expiredWaitlists = await this.prisma.waitlist.findMany({
      where: {
        status: 'NOTIFIED',
        claimExpiresAt: {
          lt: new Date(),
        }
      }
    });

    for (const waitlist of expiredWaitlists) {
      await this.prisma.waitlist.update({
        where: { id: waitlist.id },
        data: { status: 'EXPIRED' }
      });
      this.logger.log(`Waitlist expired for user ${waitlist.userId} on show ${waitlist.showId}.`);
      
      // Notify the next user in line
      await this.notifyNextUser(waitlist.showId).catch(err => this.logger.error('Failed to notify next user', err));
    }
  }
}
