import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository extends PrismaBaseRepository<User> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }
}
