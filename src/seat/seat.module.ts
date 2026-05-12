import { Module } from '@nestjs/common';

import { SeatController } from './seat.controller';
import { SeatService } from './seat.service';

import { SeatRepository } from './seat.repository';
import { ScreenModule } from 'src/screen/screen.module';

@Module({
  imports: [ScreenModule],

  controllers: [SeatController],

  providers: [SeatService, SeatRepository],

  exports: [SeatRepository, SeatService],
})
export class SeatModule {}
