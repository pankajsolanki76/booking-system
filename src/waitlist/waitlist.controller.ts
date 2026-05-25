import { Controller, Post, Body } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @Auth()
  async joinWaitlist(
    @Body() dto: JoinWaitlistDto,
    @CurrentUser() user: any,
  ) {
    return this.waitlistService.joinWaitlist(user.id, dto.showId);
  }
}
