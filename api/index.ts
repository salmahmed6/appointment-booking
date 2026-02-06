import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import serverless from 'serverless-http';

const server = express();
let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    try {
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(server),
      );

      app.enableCors({
        origin: '*',
        credentials: true,
      });

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      // IMPORTANT: Initialize app BEFORE setting up Swagger
      await app.init();

      // Setup Swagger AFTER app.init()
      const config = new DocumentBuilder()
        .setTitle('Appointment Booking API')
        .setDescription('API documentation for appointment booking system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);

      cachedApp = serverless(server);
      console.log('NestJS app initialized successfully on Vercel');
    } catch (error) {
      console.error('Failed to initialize NestJS app:', error);
      throw error;
    }
  }

  return cachedApp;
}

export default async function handler(req, res) {
  try {
    const app = await bootstrap();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}