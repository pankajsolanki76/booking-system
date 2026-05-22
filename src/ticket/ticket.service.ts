import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(private readonly prisma: PrismaService) {}

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

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Movie Ticket - ${eventTitle}</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .ticket-container {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid #334155;
            border-radius: 20px;
            width: 380px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            position: relative;
        }
        .ticket-header {
            background: linear-gradient(to right, #6366f1, #3b82f6);
            padding: 24px;
            text-align: center;
            position: relative;
        }
        .ticket-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.025em;
        }
        .ticket-body {
            padding: 24px;
        }
        .ticket-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
            font-size: 0.875rem;
        }
        .detail-label {
            color: #94a3b8;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        .detail-value {
            font-weight: 600;
            color: #e2e8f0;
        }
        .full-width {
            grid-column: span 2;
        }
        .ticket-divider {
            border-top: 2px dashed #334155;
            position: relative;
            margin: 10px 0;
        }
        .ticket-divider::before, .ticket-divider::after {
            content: '';
            position: absolute;
            top: -10px;
            width: 20px;
            height: 20px;
            background-color: #0f172a;
            border-radius: 50%;
        }
        .ticket-divider::before {
            left: -34px;
            border-right: 1px solid #334155;
        }
        .ticket-divider::after {
            right: -34px;
            border-left: 1px solid #334155;
        }
        .ticket-footer {
            padding: 24px;
            text-align: center;
            background-color: rgba(30, 41, 59, 0.5);
        }
        .qr-code-img {
            background-color: #ffffff;
            padding: 8px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin-bottom: 12px;
            display: inline-block;
        }
        .booking-id {
            font-family: monospace;
            font-size: 0.75rem;
            color: #64748b;
        }
        .thank-you {
            font-size: 0.875rem;
            color: #10b981;
            font-weight: 600;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="ticket-header">
            <h2>ADMIT ONE</h2>
        </div>
        <div class="ticket-body">
            <div class="ticket-details">
                <div class="full-width">
                    <div class="detail-label">Movie / Event</div>
                    <div class="detail-value" style="font-size: 1.125rem; color: #ffffff;">${eventTitle}</div>
                </div>
                <div class="full-width">
                    <div class="detail-label">Venue</div>
                    <div class="detail-value">${venueName} - ${screenName}</div>
                </div>
                <div class="full-width">
                    <div class="detail-label">Date & Time</div>
                    <div class="detail-value">${startTime}</div>
                </div>
                <div>
                    <div class="detail-label">Seats</div>
                    <div class="detail-value" style="color: #60a5fa; font-size: 1.125rem;">${seats}</div>
                </div>
                <div>
                    <div class="detail-label">Amount Paid</div>
                    <div class="detail-value">$${amount}</div>
                </div>
                <div class="full-width">
                    <div class="detail-label">Customer</div>
                    <div class="detail-value">${userName} (${userEmail})</div>
                </div>
            </div>
        </div>
        <div class="ticket-divider"></div>
        <div class="ticket-footer">
            <div class="qr-code-img">
                <img src="${qrCodeUrl}" alt="Ticket QR Code" width="160" height="160" style="display: block;">
            </div>
            <div class="booking-id">ID: ${booking.id}</div>
            <div class="booking-id">Ref: ${paymentRef}</div>
            <div class="thank-you">Scan this ticket at check-in</div>
        </div>
    </div>
</body>
</html>
      `;

      const dir = path.join(process.cwd(), 'logs', 'tickets');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filePath = path.join(dir, `ticket_${booking.id}.html`);
      fs.writeFileSync(filePath, htmlContent, 'utf-8');

      this.logger.log(`Ticket generated successfully and saved to ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to dispatch ticket for booking ${bookingId}`, error);
    }
  }
}
