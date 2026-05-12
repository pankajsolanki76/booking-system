import { BadRequestException, Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

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

    const user = await this.userRepository.create({
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
}
