import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ScreenService } from './screen.service';
import { CreateScreenDto } from './dto/create-screen.dto';
import { Role } from '../common/enums/role.enum';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Screens')
@Controller('screens')
export class ScreenController {
  constructor(private readonly screenService: ScreenService) {}

  @Post()
  @Auth(Role.ADMIN)
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
