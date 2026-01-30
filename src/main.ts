import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const envs = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const notReadyEnvs: string[] = [];

  envs.forEach((env) => {
    if (!process.env[env]) {
      notReadyEnvs.push(env);
    }
  });

  if (notReadyEnvs.length > 0) {
    console.error(
      'Missing required environment variables:',
      notReadyEnvs.join(', '),
    );
    process.exit(1);
  }

  const config = new DocumentBuilder()
    .setTitle('rvchan-backend API')
    .setDescription('rvchan-backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = SwaggerModule.createDocument(app, config);

  for (const path of Object.values(documentFactory.paths)) {
    for (const method of Object.values(path)) {
      method.security = [{ bearer: [] }];
    }
  }

  SwaggerModule.setup('swag', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
