import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Analytics Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @Auth(Role.SUPER_ADMIN, Role.ADMIN, Role.THEATER_MANAGER)
  @ApiOperation({ summary: 'Get total revenue' })
  async getRevenue(@CurrentUser() user: any) {
    return this.analyticsService.getRevenue(user.id, user.role);
  }

  @Get('top-events')
  @Auth(Role.SUPER_ADMIN, Role.ADMIN, Role.THEATER_MANAGER)
  @ApiOperation({ summary: 'Get best performing movies/events' })
  async getTopEvents(@CurrentUser() user: any) {
    return this.analyticsService.getTopEvents(user.id, user.role);
  }
}
