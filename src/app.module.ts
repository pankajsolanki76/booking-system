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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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
  ],
})
export class AppModule {}