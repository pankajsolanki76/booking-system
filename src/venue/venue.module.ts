import { Module } from '@nestjs/common';

import { VenueController } from './venue.controller';
import { VenueService } from './venue.service';

import { VenueRepository } from './venue.repository';

@Module({
  controllers: [VenueController],

  providers: [VenueService, VenueRepository],

  exports: [VenueRepository, VenueService],
})
export class VenueModule {}
