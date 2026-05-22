import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { EventRepository } from './event.repository';
import { CategoryRepository } from '../category/category.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('EventService', () => {
  let service: EventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: EventRepository,
          useValue: {
            findBySlug: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CategoryRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            booking: {
              findFirst: jest.fn(),
            },
            $transaction: jest.fn((cb) =>
              cb({
                event: { update: jest.fn() },
                show: { updateMany: jest.fn() },
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
