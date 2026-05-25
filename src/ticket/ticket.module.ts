import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { MailService } from './mail.service';

@Module({
  providers: [TicketService, MailService],
  exports: [TicketService, MailService],
})
export class TicketModule {}
