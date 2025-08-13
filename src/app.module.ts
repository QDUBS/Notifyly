import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import channelsConfig from './config/channels.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { QueueModule } from './utils/queue/queue.module';
import { NotificationWorkerModule } from './workers/notification-worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, channelsConfig],
      envFilePath: ['.env'],
    }),

    // Configure Winston for logging
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message }) => {
              return `${timestamp} [${level}]: ${message}`;
            }),
          ),
        }),
      ],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        autoLoadEntities: true,
        synchronize: true, // Set to false in production, use migrations
        logging: ['error', 'warn'],
      }),
    }),

    AuthModule,
    UsersModule,
    NotificationsModule,
    EventsModule,
    AdminModule,
    QueueModule,
    NotificationWorkerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
