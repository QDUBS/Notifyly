import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventNotificationMapping } from 'src/events/entities/event-notification-mapping.entity';
import { NotificationTemplate } from 'src/notifications/entities/notification-template.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import { UserPreference } from 'src/users/entities/user-preference.entity';
import { EmailService } from 'src/utils/channels/email.service';
import { InAppService } from 'src/utils/channels/in-app.service';
import { SmsService } from 'src/utils/channels/sms.service';
import { HandlebarsService } from 'src/utils/handlebars/handlebars.service';
import { QueueModule } from 'src/utils/queue/queue.module';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      EventNotificationMapping,
      UserPreference,
    ]),
    QueueModule,
  ],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    InAppService,
    HandlebarsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
