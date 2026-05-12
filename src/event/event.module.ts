import { Module } from '@nestjs/common';

import { EventController } from './event.controller';
import { EventService } from './event.service';

import { EventRepository } from './event.repository';

import { CategoryModule } from '../category/category.module';

@Module({
  imports: [CategoryModule],

  controllers: [EventController],

  providers: [
    EventService,
    EventRepository,
  ],

  exports: [
    EventService,
    EventRepository,
  ],
})
export class EventModule {}