import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository extends PrismaBaseRepository<User> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.user);
  }

  override async findById(id: string, include?: any) {
    return this.prisma.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      ...(include && { include }),
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        isDeleted: false,
      },
    });
  }

  async findByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findFirst({
      where: {
        phoneNumber,
        isDeleted: false,
      },
    });
  }
}

