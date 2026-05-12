import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { CategoryRepository } from '../category/category.repository';

import { slugify } from '../common/utils/slugify.util';

import { CreateEventDto } from './dto/create-event.dto';

import { EventRepository } from './event.repository';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,

    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(
    createEventDto: CreateEventDto,
  ) {
    const category =
      await this.categoryRepository.findById(
        createEventDto.categoryId,
      );

    if (!category) {
      throw new BadRequestException(
        'Invalid category',
      );
    }

    return this.eventRepository.create({
      ...createEventDto,

      slug: slugify(createEventDto.title),
    });
  }

  async findAll() {
    return this.eventRepository.findAll();
  }

  async findOne(id: string) {
    return this.eventRepository.findById(id);
  }
}