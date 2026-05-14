import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';

import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BaseController } from '../common/controllers/base.controller';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/enums/role.enum';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Users')
@Controller('users')
export class UserController extends BaseController<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Get current user profile' })
  me(@CurrentUser() user: unknown) {
    return user;
  }


  @Get()
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  override async findAll() {
    return super.findAll({});
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Update user' })
  override async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return super.update(id, updateUserDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }
}

