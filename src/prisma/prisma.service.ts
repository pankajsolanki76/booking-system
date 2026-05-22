import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    let url = databaseUrl;

    if (databaseUrl && !databaseUrl.includes('connection_limit')) {
      const hasQueryParams = databaseUrl.includes('?');
      url = `${databaseUrl}${hasQueryParams ? '&' : '?'}connection_limit=10`;
    }

    super({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
