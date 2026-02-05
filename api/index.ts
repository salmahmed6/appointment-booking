import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { ServicesModule } from '../src/services/services.module';
import { BookingsModule } from '../src/bookings/bookings.module';
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

      // Swagger Setup
      const config = new DocumentBuilder()
        .setTitle('Appointment Booking API')
        .setDescription('API documentation for appointment booking system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config, {
        include: [
          AuthModule,
          UsersModule,
          ServicesModule,
          BookingsModule,
        ],
      });

      SwaggerModule.setup('api', app, document);

      await app.init();

      cachedApp = serverless(server);
      console.log(' NestJS app initialized successfully on Vercel');
    } catch (error) {
      console.error(' Failed to initialize NestJS app:', error);
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
