import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.use(compression());

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // REGISTER INTERCEPTOR
  app.useGlobalInterceptors(new ResponseInterceptor());

  // REGISTER EXCEPTION FILTER
  app.useGlobalFilters(new HttpExceptionFilter());

  const prismaService = app.get(PrismaService);

  await prismaService.enableShutdownHooks(app);

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`Application running on port ${port}`);
}

bootstrap();
