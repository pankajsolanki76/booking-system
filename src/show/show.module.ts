import { Module } from '@nestjs/common';

import { ShowController } from './show.controller';
import { ShowService } from './show.service';

import { ShowRepository } from './show.repository';

import { EventModule } from '../event/event.module';

import { ScreenModule } from '../screen/screen.module';

import { SeatModule } from '../seat/seat.module';

@Module({
  imports: [EventModule, ScreenModule, SeatModule],

  controllers: [ShowController],

  providers: [ShowService, ShowRepository],
})
export class ShowModule {}
