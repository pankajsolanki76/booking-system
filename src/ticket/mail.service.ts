import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  async onModuleInit() {
    try {
      // Create a test account on the fly for Ethereal
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      
      this.logger.log('Nodemailer configured with Ethereal mock email');
    } catch (err: any) {
      this.logger.error('Failed to initialize Nodemailer: ' + err.message);
    }
  }

  async sendTicketEmail(to: string, eventTitle: string, pdfBuffer: Buffer) {
    if (!this.transporter) {
      this.logger.warn('Email transporter not ready');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"AMC Cinema System" <no-reply@amc.com>',
        to,
        subject: `Your Tickets for ${eventTitle} are here!`,
        text: `Thank you for booking! Attached is your official ticket for ${eventTitle}. Enjoy the show!`,
        html: `<b>Thank you for booking!</b><br>Attached is your official ticket for <i>${eventTitle}</i>. Enjoy the show!`,
        attachments: [
          {
            filename: `${eventTitle.replace(/\\s+/g, '_')}_Ticket.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(`Ticket email sent: ${info.messageId}`);
      // The crucial ethereal URL:
      this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error: any) {
      this.logger.error(`Error sending email to ${to}: ${error.message}`);
    }
  }
}
