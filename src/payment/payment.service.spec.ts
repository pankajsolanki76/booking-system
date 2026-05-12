import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingRepository } from '../booking/booking.repository';
import { PaymentRepository } from './payment.repository';
import { SeatRepository } from '../seat/seat.repository';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
        {
          provide: BookingRepository,
          useValue: {
            findBookingById: jest.fn(),
          },
        },
        {
          provide: PaymentRepository,
          useValue: {
            createPayment: jest.fn(),
          },
        },
        {
          provide: SeatRepository,
          useValue: {
            bookSeats: jest.fn(),
            releaseSeats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
