import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // Local Next.js
      'https://your-frontend.vercel.app', // Change later
    ],
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //Swagger Setup
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

  //Run server ONLY locally
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(3001);

    console.log(
      'Server running on http://localhost:3001',
    );
    console.log(
      'Swagger docs at http://localhost:3001/api',
    );
  }
}

bootstrap();
