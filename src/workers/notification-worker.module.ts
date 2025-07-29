import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { NotificationWorkerService } from './notification-worker.service';
import { EmailService } from 'src/utils/channels/email.service';
import { SmsService } from 'src/utils/channels/sms.service';
import { InAppService } from 'src/utils/channels/in-app.service';

@Module({
  imports: [NotificationsModule, ConfigModule],
  providers: [
    NotificationWorkerService,
    EmailService,
    SmsService,
    InAppService,
  ],
  exports: [NotificationWorkerService],
})
export class NotificationWorkerModule {}
