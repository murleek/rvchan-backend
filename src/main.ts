import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import cors from '@fastify/cors';

import { AppModule } from './app.module';

const REQUIRED_ENVS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
] as const;

function validateEnv() {
  const missing = REQUIRED_ENVS.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required env variables: ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('rvchan-backend API')
    .setDescription('rvchan-backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  Object.values(document.paths).forEach((path) => {
    Object.values(path).forEach((method: any) => {
      method.security = [{ bearer: [] }];
    });
  });

  SwaggerModule.setup('swag', app, document, {
    jsonDocumentUrl: 'swag/json',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
