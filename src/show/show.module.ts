import { Module } from '@nestjs/common';

import { ShowController } from './show.controller';
import { ShowService } from './show.service';

import { ShowRepository } from './show.repository';

import { EventModule } from '../event/event.module';
import { ScreenModule } from 'src/screen/screen.module';

@Module({
  imports: [EventModule,ScreenModule],

  controllers: [ShowController],

  providers: [ShowService, ShowRepository],
})
export class ShowModule {}
