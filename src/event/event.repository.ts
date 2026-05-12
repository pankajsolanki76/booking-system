import { Event, Prisma } from '@prisma/client';

import { BaseFindAllQuery } from '../common/interfaces/repository-query.interface';

export interface EventFindAllQuery extends BaseFindAllQuery {
  search?: string;
  categoryId?: string;
}

@Injectable()
export class EventRepository extends PrismaBaseRepository<Event> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.event);
  }

  override async findById(id: string) {
    return super.findById(id, {
      category: true,
      shows: true,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.event.findUnique({
      where: { slug },
    });
  }

  async findAll(query: EventFindAllQuery) {
    const {
      skip,
      take,
      search,
      categoryId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,

        skip,

        take,

        orderBy: {
          [sortBy]: sortOrder,
        },

        include: {
          category: true,
        },
      }),

      this.prisma.event.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }
}
