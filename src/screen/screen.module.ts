import { Module } from '@nestjs/common';

import { ScreenController } from './screen.controller';
import { ScreenService } from './screen.service';

import { ScreenRepository } from './screen.repository';

import { VenueModule } from '../venue/venue.module';

@Module({
  imports: [VenueModule],

  controllers: [ScreenController],

  providers: [ScreenService, ScreenRepository],

  exports: [ScreenRepository, ScreenService],
})
export class ScreenModule {}
