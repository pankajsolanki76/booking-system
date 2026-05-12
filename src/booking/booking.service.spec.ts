import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingRepository } from './booking.repository';
import { SeatRepository } from '../seat/seat.repository';

describe('BookingService', () => {
  let service: BookingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
        {
          provide: BookingRepository,
          useValue: {
            createBooking: jest.fn(),
            createBookingSeats: jest.fn(),
            findUserBookings: jest.fn(),
            findBookingById: jest.fn(),
          },
        },
        {
          provide: SeatRepository,
          useValue: {
            findAvailableShowSeats: jest.fn(),
            lockSeats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
