import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
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
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { validate } from './common/config/env.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      validate,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,

        limit: 10,
      },
    ]),

    ScheduleModule.forRoot(),
    WinstonModule.forRoot(winstonConfig),

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

  providers: [
    {
      provide: APP_GUARD,

      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

