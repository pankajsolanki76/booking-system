import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ScreenService } from './screen.service';

import { CreateScreenDto } from './dto/create-screen.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

@ApiTags('Screens')
@ApiBearerAuth('JWT-auth')
@Controller('screens')
export class ScreenController {
  constructor(private readonly screenService: ScreenService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create screen',
  })
  @ApiResponse({
    status: 201,
    description: 'Screen created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid venue',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async create(
    @Body()
    createScreenDto: CreateScreenDto,
  ) {
    return this.screenService.create(createScreenDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all screens',
  })
  @ApiResponse({
    status: 200,
    description: 'Screens fetched successfully',
  })
  async findAll() {
    return this.screenService.findAll();
  }
}
