import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { EventModule } from './event/event.module';
import { ShowModule } from './show/show.module';
import { VenueModule } from './venue/venue.module';
import { ScreenModule } from './screen/screen.module';
import { SeatModule } from './seat/seat.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    PrismaModule,
    HealthModule,
    UserModule,
    AuthModule,
    CategoryModule,
    EventModule,
    ShowModule,
    VenueModule,
    ScreenModule,
    SeatModule,
    BookingModule,
    PaymentModule,
  ],
})
export class AppModule {}
