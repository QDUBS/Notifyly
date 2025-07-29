import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventNotificationMapping } from 'src/events/entities/event-notification-mapping.entity';
import { NotificationTemplate } from 'src/notifications/entities/notification-template.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserPreference } from 'src/users/entities/user-preference.entity';
import { HandlebarsService } from 'src/utils/handlebars/handlebars.service';
import { QueueService } from 'src/utils/queue/queue.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      EventNotificationMapping,
      UserPreference,
    ]),
    NotificationsModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    NotificationsService,
    QueueService,
    HandlebarsService,
  ],
})
export class AdminModule {}
