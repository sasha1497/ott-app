import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression = require('compression');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const config = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());

  app.enableCors({
    origin: config.get<string>('cors.origin'),
    credentials: true,
  });

  app.setGlobalPrefix(config.get<string>('apiPrefix') ?? 'api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`OTT backend running on http://localhost:${port}/${config.get('apiPrefix')}`);
}

bootstrap();
