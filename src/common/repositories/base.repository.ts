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
}
