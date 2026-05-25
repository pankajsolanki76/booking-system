import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { MailService } from './mail.service';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async generateQrCode(text: string): Promise<string> {
    try {
      // Generate QR code as Base64 Data URL (e.g. data:image/png;base64,...)
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 200,
      });
    } catch (err) {
      this.logger.error('Failed to generate QR Code', err);
      throw err;
    }
  }

  async dispatchTicket(bookingId: string): Promise<void> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          show: {
            include: {
              event: true,
              screen: {
                include: {
                  venue: true,
                },
              },
            },
          },
          payment: true,
          bookingSeats: {
            include: {
              showSeat: {
                include: {
                  screenSeat: true,
                },
              },
            },
          },
        },
      });

      if (!booking) {
        this.logger.error(`Booking not found for ticket dispatch: ${bookingId}`);
        return;
      }

      const qrCodeUrl = await this.generateQrCode(booking.id);

      const eventTitle = booking.show?.event?.title || 'Unknown Event';
      const venueName = booking.show?.screen?.venue?.name || 'Unknown Venue';
      const screenName = booking.show?.screen?.name || 'Unknown Screen';
      const startTime = booking.show?.startTime ? new Date(booking.show.startTime).toLocaleString() : 'Unknown Showtime';
      const userName = booking.user?.name || 'Valued Customer';
      const userEmail = booking.user?.email || '';
      
      const seats = booking.bookingSeats?.map((bs: any) => {
        const row = bs.showSeat?.screenSeat?.rowLabel || '';
        const num = bs.showSeat?.screenSeat?.seatNumber || '';
        return `${row}${num}`;
      }).join(', ') || 'N/A';

      const amount = booking.totalAmount ? Number(booking.totalAmount).toFixed(2) : '0.00';
      const paymentRef = booking.payment?.transactionRef || 'N/A';

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 50, size: 'A4' });
          const buffers: Buffer[] = [];

          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => resolve(Buffer.concat(buffers)));

          doc.fontSize(25).fillColor('#3b82f6').text('ADMIT ONE - OFFICIAL TICKET', { align: 'center' });
          doc.moveDown();

          doc.fontSize(20).fillColor('#000000').text(eventTitle, { align: 'center' });
          doc.moveDown();

          doc.fontSize(14).text(`Venue: ${venueName} - ${screenName}`);
          doc.text(`Time: ${startTime}`);
          doc.text(`Seats: ${seats}`);
          doc.text(`Amount Paid: $${amount}`);
          doc.text(`Customer: ${userName} (${userEmail})`);
          doc.moveDown();

          doc.text(`Booking ID: ${booking.id}`);
          doc.text(`Ref: ${paymentRef}`);
          doc.moveDown();

          // Add QR code image
          const base64Data = qrCodeUrl.replace(/^data:image\/png;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          
          doc.image(imgBuffer, {
            fit: [150, 150],
            align: 'center',
          });

          doc.end();
        } catch (err) {
          reject(err);
        }
      });

      if (userEmail) {
        await this.mailService.sendTicketEmail(userEmail, eventTitle, pdfBuffer);
      } else {
        this.logger.warn(`No email found for booking ${bookingId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to dispatch ticket for booking ${bookingId}`, error);
    }
  }
}
