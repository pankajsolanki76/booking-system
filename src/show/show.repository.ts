import { Show, Prisma } from '@prisma/client';
import { BaseFindAllQuery } from '../common/interfaces/repository-query.interface';
import { Injectable } from '@nestjs/common';
import { PrismaBaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

export interface ShowFindAllQuery extends BaseFindAllQuery {
  eventId?: string;
}

@Injectable()
export class ShowRepository extends PrismaBaseRepository<Show> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.show);
  }

  async findAllShows(params: {
    where?: Prisma.ShowWhereInput;
    skip?: number;
    take?: number;
    orderBy?: any;
    include?: any;
  }) {
    const [data, total] = await Promise.all([
      this.findMany(params),
      this.count(params.where),
    ]);

    return {
      data,
      total,
    };
  }
}

