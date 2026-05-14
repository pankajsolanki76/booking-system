import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Auth()
  async check() {
    return this.healthService.check();
  }
}

