import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './common/config/swagger.config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  setupSwagger(app);

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
  app.useGlobalFilters(new AllExceptionsFilter());

  const prismaService = app.get(PrismaService);

  await prismaService.enableShutdownHooks(app);

  const port = process.env.PORT || 3000;

  await app.listen(port);

  Logger.log(`Application running on port ${port}`, 'Bootstrap');
}

bootstrap();
