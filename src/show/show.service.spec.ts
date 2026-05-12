import { Test, TestingModule } from '@nestjs/testing';
import { ShowService } from './show.service';
import { ShowRepository } from './show.repository';
import { EventRepository } from '../event/event.repository';
import { ScreenRepository } from '../screen/screen.repository';
import { SeatRepository } from '../seat/seat.repository';

describe('ShowService', () => {
  let service: ShowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowService,
        {
          provide: ShowRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: EventRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ScreenRepository,
          useValue: {
            findById: jest.fn(),
            getSeats: jest.fn(),
          },
        },
        {
          provide: SeatRepository,
          useValue: {
            createShowSeats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ShowService>(ShowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
