export abstract class PrismaBaseRepository<T> {
  constructor(protected readonly delegate: any) {}

  async create(data: any): Promise<T> {
    return this.delegate.create({ data });
  }

  async findById(id: string, include?: any): Promise<T | null> {
    return this.delegate.findUnique({
      where: { id },
      ...(include && { include }),
    });
  }

  async findOne(where: any, include?: any): Promise<T | null> {
    return this.delegate.findFirst({
      where,
      ...(include && { include }),
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: any;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<T[]> {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.delegate.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    });
  }

  async update(id: string, data: any): Promise<T> {
    return this.delegate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.delegate.delete({
      where: { id },
    });
  }

  async count(where?: any): Promise<number> {
    return this.delegate.count({ where });
  }
}

