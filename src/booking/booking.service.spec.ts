import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingRepository } from './booking.repository';
import { SeatRepository } from '../seat/seat.repository';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Subject } from 'rxjs';
import { TicketService } from '../ticket/ticket.service';
import { StripeService } from '../payment/stripe.service';

describe('BookingService', () => {
  let service: BookingService;
  let prismaServiceMock: any;
  let bookingRepositoryMock: any;
  let seatRepositoryMock: any;
  let ticketServiceMock: any;
  let stripeServiceMock: any;
  let txMock: any;

  beforeEach(async () => {
    txMock = {
      booking: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      showSeat: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      showSeatHistory: {
        createMany: jest.fn(),
      },
      bookingSeat: {
        deleteMany: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    prismaServiceMock = {
      $transaction: jest.fn((cb) => cb(txMock)),
      booking: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    bookingRepositoryMock = {
      findOne: jest.fn(),
    };

    seatRepositoryMock = {
      seatUpdates$: new Subject<any>(),
    };

    ticketServiceMock = {
      generateQrCode: jest.fn(),
      dispatchTicket: jest.fn(),
    };

    stripeServiceMock = {
      createRefund: jest.fn().mockResolvedValue({ refundId: 'mock-refund-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: BookingRepository,
          useValue: bookingRepositoryMock,
        },
        {
          provide: SeatRepository,
          useValue: seatRepositoryMock,
        },
        {
          provide: TicketService,
          useValue: ticketServiceMock,
        },
        {
          provide: StripeService,
          useValue: stripeServiceMock,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cancelBooking', () => {
    it('should throw ForbiddenException if user is not owner and not admin', async () => {
      txMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        bookingStatus: 'PENDING',
        show: { startTime: new Date(Date.now() + 3600000) },
        bookingSeats: [],
      });

      await expect(service.cancelBooking('booking-1', 'user-2', 'USER')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if show already started', async () => {
      txMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        bookingStatus: 'PENDING',
        show: { startTime: new Date(Date.now() - 3600000) }, // past
        bookingSeats: [],
      });

      await expect(service.cancelBooking('booking-1', 'user-1', 'USER')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should cancel booking and release seats if owner cancels', async () => {
      txMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
        showId: 'show-1',
        show: { startTime: new Date(Date.now() + 3 * 3600000) }, // 3 hours in the future
        bookingSeats: [{ showSeatId: 'show-seat-1' }],
      });

      txMock.showSeat.findMany.mockResolvedValue([
        { id: 'show-seat-1', status: 'BOOKED' },
      ]);

      txMock.booking.update.mockResolvedValue({ id: 'booking-1', bookingStatus: 'CANCELLED' });

      const spyEmit = jest.spyOn(seatRepositoryMock.seatUpdates$, 'next');

      const result = await service.cancelBooking('booking-1', 'user-1', 'USER');

      expect(txMock.showSeat.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['show-seat-1'] },
          showId: 'show-1',
        },
        data: {
          status: 'AVAILABLE',
          lockedAt: null,
          lockedUntil: null,
          bookedAt: null,
        },
      });

      expect(txMock.showSeatHistory.createMany).toHaveBeenCalledWith({
        data: [
          { showSeatId: 'show-seat-1', oldStatus: 'BOOKED', newStatus: 'AVAILABLE', changedBy: 'USER_CANCEL_user-1' },
        ],
      });

      expect(txMock.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          bookingStatus: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        },
      });

      expect(spyEmit).toHaveBeenCalledWith({
        showId: 'show-1',
        seatIds: ['show-seat-1'],
        status: 'AVAILABLE',
      });

      expect(result.message).toBe('Booking cancelled successfully');
    });

    it('should throw BadRequestException if owner cancels less than 2 hours before the show', async () => {
      txMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
        showId: 'show-1',
        show: { startTime: new Date(Date.now() + 3600000) }, // 1 hour in the future
        bookingSeats: [{ showSeatId: 'show-seat-1' }],
      });

      await expect(service.cancelBooking('booking-1', 'user-1', 'USER')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow admin to cancel less than 2 hours before the show but before it starts', async () => {
      txMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
        showId: 'show-1',
        show: { startTime: new Date(Date.now() + 3600000) }, // 1 hour in the future
        bookingSeats: [{ showSeatId: 'show-seat-1' }],
      });

      txMock.showSeat.findMany.mockResolvedValue([
        { id: 'show-seat-1', status: 'BOOKED' },
      ]);
      txMock.booking.update.mockResolvedValue({ id: 'booking-1', bookingStatus: 'CANCELLED' });

      const result = await service.cancelBooking('booking-1', 'admin-1', 'ADMIN');
      expect(result.message).toBe('Booking cancelled successfully');
    });
  });

  describe('createBooking', () => {
    it('should throw BadRequestException if more than 6 seats are selected', async () => {
      const dto = {
        showId: 'show-1',
        seatIds: ['seat-1', 'seat-2', 'seat-3', 'seat-4', 'seat-5', 'seat-6', 'seat-7'],
      };

      await expect(service.createBooking('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove (admin delete override)', () => {
    it('should release seats and hard-delete the booking record', async () => {
      txMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        showId: 'show-1',
        bookingSeats: [{ showSeatId: 'show-seat-1' }],
      });

      txMock.showSeat.findMany.mockResolvedValue([
        { id: 'show-seat-1', status: 'BOOKED' },
      ]);

      const spyEmit = jest.spyOn(seatRepositoryMock.seatUpdates$, 'next');

      const result = await service.remove('booking-1');

      expect(txMock.showSeat.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['show-seat-1'] },
          showId: 'show-1',
        },
        data: {
          status: 'AVAILABLE',
          lockedAt: null,
          lockedUntil: null,
          bookedAt: null,
        },
      });

      expect(txMock.bookingSeat.deleteMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' },
      });

      expect(txMock.payment.deleteMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' },
      });

      expect(txMock.booking.delete).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
      });

      expect(spyEmit).toHaveBeenCalledWith({
        showId: 'show-1',
        seatIds: ['show-seat-1'],
        status: 'AVAILABLE',
      });

      expect(result.message).toBe('Booking deleted successfully and seats released');
    });
  });

  describe('getTicketDetails', () => {
    it('should throw NotFoundException if booking not found', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue(null);

      await expect(service.getTicketDetails('booking-1', { id: 'user-1', role: 'USER' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if booking status is not CONFIRMED', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        bookingStatus: 'PENDING',
      });

      await expect(service.getTicketDetails('booking-1', { id: 'user-1', role: 'USER' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user is not owner and not admin', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        bookingStatus: 'CONFIRMED',
      });

      await expect(service.getTicketDetails('booking-1', { id: 'user-2', role: 'USER' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return ticket details and QR code if owner requests confirmed booking', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        bookingStatus: 'CONFIRMED',
        totalAmount: 100,
        show: {
          startTime: new Date(),
          event: { title: 'Movie 1' },
          screen: {
            name: 'Screen 1',
            venue: { name: 'Venue 1' },
          },
        },
        bookingSeats: [
          {
            showSeat: {
              screenSeat: {
                rowLabel: 'A',
                seatNumber: 1,
              },
            },
          },
        ],
      });

      ticketServiceMock.generateQrCode.mockResolvedValue('base64-qrcode-url');

      const result = await service.getTicketDetails('booking-1', { id: 'user-1', role: 'USER' });

      expect(result.bookingId).toBe('booking-1');
      expect(result.qrCode).toBe('base64-qrcode-url');
      expect(result.eventTitle).toBe('Movie 1');
      expect(result.seats).toEqual(['A1']);
    });
  });

  describe('verifyTicket', () => {
    it('should throw NotFoundException if booking not found', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue(null);

      await expect(service.verifyTicket('booking-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking is not confirmed', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        bookingStatus: 'PENDING',
      });

      await expect(service.verifyTicket('booking-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if ticket is already checked in', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        bookingStatus: 'CONFIRMED',
        checkedInAt: new Date(),
      });

      await expect(service.verifyTicket('booking-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if show has already ended', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        bookingStatus: 'CONFIRMED',
        checkedInAt: null,
        show: {
          endTime: new Date(Date.now() - 60000), // ended 1 min ago
        },
      });

      await expect(service.verifyTicket('booking-1')).rejects.toThrow(BadRequestException);
    });

    it('should verify check-in and update checkedInAt if valid', async () => {
      prismaServiceMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        bookingStatus: 'CONFIRMED',
        checkedInAt: null,
        show: {
          endTime: new Date(Date.now() + 3600000), // in 1 hour
        },
      });

      prismaServiceMock.booking.update.mockResolvedValue({
        id: 'booking-1',
        checkedInAt: new Date(),
      });

      const result = await service.verifyTicket('booking-1');

      expect(result.message).toBe('Check-in successful');
      expect(result.bookingId).toBe('booking-1');
      expect(result.checkedInAt).toBeDefined();
    });
  });
});
