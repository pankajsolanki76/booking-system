import { Test, TestingModule } from '@nestjs/testing';
import { SeatService } from './seat.service';
import { SeatRepository } from './seat.repository';
import { ScreenRepository } from '../screen/screen.repository';

describe('SeatService', () => {
  let service: SeatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatService,
        {
          provide: SeatRepository,
          useValue: {
            createScreenSeat: jest.fn(),
            findShowSeats: jest.fn(),
          },
        },
        {
          provide: ScreenRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SeatService>(SeatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
