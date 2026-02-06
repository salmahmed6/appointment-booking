import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        
        const baseConfig = {
          type: 'postgres' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProduction, // Only sync on development
          logging: !isProduction, // Only log on development
          autoLoadEntities: true,
          keepConnectionAlive: true,
        };

        // If DATABASE_URL is provided (Neon), use it
        if (databaseUrl) {
          return {
            ...baseConfig,
            url: databaseUrl,
            ssl: { rejectUnauthorized: false }, // required for Neon
            extra: {
              max: 1, // Vercel serverless max connection
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 10000,
            },
          };
        }
        
        // Fallback to individual connection parameters (local development)
        return {
          ...baseConfig,
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: Number(configService.get<string>('DB_PORT')) || 5432,
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}