import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Express } from 'express';

let app: Express;

async function bootstrap() {
  if (!app) {
    try {
      const server = express();
      
      const nestApp = await NestFactory.create(
        AppModule,
        new ExpressAdapter(server),
      );

      nestApp.enableCors({
        origin: '*',
        credentials: true,
      });

      nestApp.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      // IMPORTANT: Initialize app BEFORE setting up Swagger
      await nestApp.init();

      // Setup Swagger AFTER app.init()
      const config = new DocumentBuilder()
        .setTitle('Appointment Booking API')
        .setDescription('API documentation for appointment booking system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(nestApp, config);
      SwaggerModule.setup('api', nestApp, document);

      app = server;
      console.log(' NestJS app initialized successfully on Vercel');
    } catch (error) {
      console.error(' Failed to initialize NestJS app:', error);
      throw error;
    }
  }

  return app;
}

export default async (req, res) => {
  try {
    const server = await bootstrap();
    return server(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};