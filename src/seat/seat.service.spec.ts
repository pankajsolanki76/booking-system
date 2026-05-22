import { Test, TestingModule } from '@nestjs/testing';
import { SeatService } from './seat.service';
import { SeatRepository } from './seat.repository';
import { ScreenRepository } from '../screen/screen.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Subject } from 'rxjs';
import { SeatStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('SeatService', () => {
  let service: SeatService;
  let seatRepositoryMock: any;
  let prismaServiceMock: any;

  beforeEach(async () => {
    seatRepositoryMock = {
      createScreenSeat: jest.fn(),
      findShowSeats: jest.fn(),
      findById: jest.fn(),
      deactivateSeat: jest.fn(),
      activateSeat: jest.fn(),
      seatUpdates$: new Subject<{
        showId: string;
        seatIds: string[];
        status: SeatStatus;
      }>(),
    };

    prismaServiceMock = {
      showSeat: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatService,
        {
          provide: SeatRepository,
          useValue: seatRepositoryMock,
        },
        {
          provide: ScreenRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<SeatService>(SeatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getShowSeatUpdates', () => {
    it('should filter events by showId and format as MessageEvent', (done) => {
      const showId = 'show-1';
      const seatUpdatesObservable = service.getShowSeatUpdates(showId);

      const receivedEvents: any[] = [];
      seatUpdatesObservable.subscribe({
        next: (event) => {
          receivedEvents.push(event);
        },
        complete: () => {
          expect(receivedEvents).toHaveLength(1);
          expect(receivedEvents[0]).toEqual({
            data: {
              seatIds: ['seat-a', 'seat-b'],
              status: 'LOCKED',
            },
          });
          done();
        },
      });

      // Emit matching event
      seatRepositoryMock.seatUpdates$.next({
        showId: 'show-1',
        seatIds: ['seat-a', 'seat-b'],
        status: 'LOCKED',
      });

      // Emit non-matching event
      seatRepositoryMock.seatUpdates$.next({
        showId: 'show-2',
        seatIds: ['seat-c'],
        status: 'BOOKED',
      });

      seatRepositoryMock.seatUpdates$.complete();
    });
  });

  describe('deactivateSeat', () => {
    it('should throw BadRequestException if seat has active locks or bookings', async () => {
      const seatId = 'seat-123';
      seatRepositoryMock.findById.mockResolvedValue({ id: seatId, isActive: true });
      prismaServiceMock.showSeat.findFirst.mockResolvedValue({ id: 'show-seat-1' });

      await expect(service.deactivateSeat(seatId)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaServiceMock.showSeat.findFirst).toHaveBeenCalledWith({
        where: {
          screenSeatId: seatId,
          status: {
            in: ['LOCKED', 'BOOKED'],
          },
          show: {
            isDeleted: false,
            endTime: {
              gt: expect.any(Date),
            },
          },
        },
      });
    });

    it('should deactivate seat if there are no active locks or bookings', async () => {
      const seatId = 'seat-123';
      seatRepositoryMock.findById.mockResolvedValue({ id: seatId, isActive: true });
      prismaServiceMock.showSeat.findFirst.mockResolvedValue(null);

      const result = await service.deactivateSeat(seatId);
      expect(seatRepositoryMock.deactivateSeat).toHaveBeenCalledWith(seatId);
      expect(result).toEqual({ message: 'Seat deactivated successfully' });
    });
  });
});
