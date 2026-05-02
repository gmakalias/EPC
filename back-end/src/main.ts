import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security & Optimization middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Enterprise Product Catalogue API')
    .setDescription('TMF620/TMF638 compliant Product Catalog Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Product Specifications', 'TMF620 Product Specification Management')
    .addTag('Product Offerings', 'TMF620 Product Offering Management')
    .addTag('Subscriptions', 'TMF638 Service Inventory Management')
    .addTag('Pricing', 'Pricing and Charging Configuration')
    .addTag('Categories', 'Category Taxonomy Management')
    .addTag('Lifecycle', 'Product Lifecycle Management')
    .addTag('Rules', 'Business Rules Engine')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 EPC API is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();