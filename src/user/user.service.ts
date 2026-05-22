import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { BaseService } from '../common/services/base.service';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }

  async register(createUserDto: CreateUserDto) {
    const existingEmail = await this.userRepository.findByEmail(
      createUserDto.email,
    );

    if (existingEmail) {
      throw new BadRequestException('Email already registered');
    }

    const existingPhone = await this.userRepository.findByPhoneNumber(
      createUserDto.phoneNumber,
    );

    if (existingPhone) {
      throw new BadRequestException('Phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await super.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return {
      message: 'User registered successfully',

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  override async findAll(params: any): Promise<any> {
    const where = {
      isDeleted: false,
      ...params.where,
    };
    return super.findAll({
      ...params,
      where,
    });
  }

  override async remove(id: string): Promise<any> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    await this.userRepository.update(id, {
      name: 'Deleted User',
      email: `deleted_${id}_${randomSuffix}@booking.system`,
      phoneNumber: `deleted_${id}_${randomSuffix}`,
      password: '',
      isDeleted: true,
      deletedAt: new Date(),
    });

    return {
      message: 'User deleted successfully',
    };
  }
}

