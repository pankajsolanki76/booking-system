import { Test, TestingModule } from '@nestjs/testing';
import { VenueService } from './venue.service';
import { VenueRepository } from './venue.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('VenueService', () => {
  let service: VenueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenueService,
        {
          provide: VenueRepository,
          useValue: {
            findByName: jest.fn(),
            findBySlug: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            booking: {
              findFirst: jest.fn(),
            },
            venue: {
              update: jest.fn(),
            },
            show: {
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VenueService>(VenueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
