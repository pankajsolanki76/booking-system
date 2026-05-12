import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { ShowService } from './show.service';

import { CreateShowDto } from './dto/create-show.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

@Controller('shows')
export class ShowController {
  constructor(private readonly showService: ShowService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createShowDto: CreateShowDto) {
    return this.showService.create(createShowDto);
  }

  @Get()
  async findAll() {
    return this.showService.findAll();
  }
}
