import { Test, TestingModule } from '@nestjs/testing';
import { ShowService } from './show.service';
import { ShowRepository } from './show.repository';
import { EventRepository } from '../event/event.repository';
import { ScreenRepository } from '../screen/screen.repository';
import { SeatRepository } from '../seat/seat.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('ShowService', () => {
  let service: ShowService;
  let prismaServiceMock: any;
  let showRepositoryMock: any;
  let txMock: any;

  beforeEach(async () => {
    txMock = {
      event: {
        findFirst: jest.fn().mockResolvedValue({ id: 'event-1', isDeleted: false }),
      },
      screen: {
        findUnique: jest.fn().mockResolvedValue({ id: 'screen-1', totalSeats: 10 }),
      },
      show: {
        create: jest.fn().mockResolvedValue({ id: 'show-1' }),
      },
      screenSeat: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'seat-1', rowLabel: 'A', price: new Prisma.Decimal(10.00) },
          { id: 'seat-2', rowLabel: 'B', price: new Prisma.Decimal(12.00) },
        ]),
      },
      showSeat: {
        createMany: jest.fn(),
      },
    };

    prismaServiceMock = {
      $transaction: jest.fn(async (cb) => await cb(txMock)),
    };

    showRepositoryMock = {
      findOverlappingShow: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: ShowRepository,
          useValue: showRepositoryMock,
        },
        {
          provide: EventRepository,
          useValue: {},
        },
        {
          provide: ScreenRepository,
          useValue: {},
        },
        {
          provide: SeatRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ShowService>(ShowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create show with pricing modifiers', () => {
    it('should apply priceMultiplier if provided', async () => {
      const createDto = {
        eventId: 'event-1',
        screenId: 'screen-1',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        priceMultiplier: 1.5,
      };

      await service.create(createDto);

      expect(txMock.showSeat.createMany).toHaveBeenCalledWith({
        data: [
          { showId: 'show-1', screenSeatId: 'seat-1', price: new Prisma.Decimal(15.00) },
          { showId: 'show-1', screenSeatId: 'seat-2', price: new Prisma.Decimal(18.00) },
        ],
      });
    });

    it('should apply customPrices override if provided', async () => {
      const createDto = {
        eventId: 'event-1',
        screenId: 'screen-1',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        customPrices: [
          { rowLabel: 'A', price: 25.00 },
        ],
      };

      await service.create(createDto);

      expect(txMock.showSeat.createMany).toHaveBeenCalledWith({
        data: [
          { showId: 'show-1', screenSeatId: 'seat-1', price: new Prisma.Decimal(25.00) },
          { showId: 'show-1', screenSeatId: 'seat-2', price: new Prisma.Decimal(12.00) },
        ],
      });
    });
  });

  describe('update show safety validations', () => {
    it('should throw BadRequestException if trying to update a past show', async () => {
      txMock.show.findFirst = jest.fn().mockResolvedValue({
        id: 'show-1',
        startTime: new Date(Date.now() - 3600000), // past show
        endTime: new Date(Date.now() - 1800000),
        screenId: 'screen-1',
        bookings: [],
      });

      await expect(service.update('show-1', { startTime: new Date(Date.now() + 3600000).toISOString() })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if setting a new start time to the past', async () => {
      txMock.show.findFirst = jest.fn().mockResolvedValue({
        id: 'show-1',
        startTime: new Date(Date.now() + 3600000), // future show
        endTime: new Date(Date.now() + 7200000),
        screenId: 'screen-1',
        bookings: [],
      });

      await expect(service.update('show-1', { startTime: new Date(Date.now() - 1800000).toISOString() })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if show has active bookings and time is updated', async () => {
      txMock.show.findFirst = jest.fn().mockResolvedValue({
        id: 'show-1',
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        screenId: 'screen-1',
        bookings: [
          { id: 'booking-1', bookingStatus: 'CONFIRMED' }
        ],
      });

      await expect(service.update('show-1', { startTime: new Date(Date.now() + 4 * 3600000).toISOString() })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if show has active bookings and screen is updated', async () => {
      txMock.show.findFirst = jest.fn().mockResolvedValue({
        id: 'show-1',
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        screenId: 'screen-1',
        bookings: [
          { id: 'booking-1', bookingStatus: 'PENDING' }
        ],
      });

      await expect(service.update('show-1', { screenId: 'screen-2' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow updates (like prices) even if there are bookings as long as screen/time are not modified', async () => {
      txMock.show.findFirst = jest.fn().mockResolvedValue({
        id: 'show-1',
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        screenId: 'screen-1',
        bookings: [
          { id: 'booking-1', bookingStatus: 'CONFIRMED' }
        ],
      });

      txMock.show.update = jest.fn().mockResolvedValue({ id: 'show-1' });
      txMock.showSeat.updateMany = jest.fn();

      const result = await service.update('show-1', { priceMultiplier: 1.2 });
      expect(result).toBeDefined();
    });
  });
});
