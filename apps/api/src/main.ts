import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Blank CORS_ORIGINS means "any origin", which is what local development and
  // a phone on the same wifi both need. Production sets it to the deployed web
  // URL. Socket.IO has its own CORS config on the gateway.
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins.length > 0 ? origins : true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Bind on all interfaces so the deployed container and a phone on the local
  // network can both reach it, not just localhost.
  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
