import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { NotificationStatus } from 'src/notifications/entities/notification.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ChannelSender } from 'src/utils/channels/channel.interface';
import { EmailService } from 'src/utils/channels/email.service';
import { InAppService } from 'src/utils/channels/in-app.service';
import { SmsService } from 'src/utils/channels/sms.service';
import { NotificationJob } from 'src/utils/queue/queue.service';

@Injectable()
export class NotificationWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private worker: Worker<NotificationJob>;
  private channelSenders: Map<string, ChannelSender>;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly inAppService: InAppService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const redisUrl =
      this.configService.get<string>('redis.host') ?? 'redis://localhost:6379';
    const connection = {
      host: new URL(redisUrl).hostname,
      port: parseInt(new URL(redisUrl).port || '6379', 10),
    };

    this.worker = new Worker<NotificationJob>(
      'notifications',
      async (job: Job<NotificationJob>) => {
        await this.processNotificationJob(job);
      },
      {
        connection: connection,
        concurrency: 5, // Process 5 jobs concurrently
      },
    );

    this.channelSenders = new Map<string, ChannelSender>();
    this.channelSenders.set('email', this.emailService);
    this.channelSenders.set('sms', this.smsService);
    this.channelSenders.set('in_app', this.inAppService);

    this.logger.debug('Notification worker initialized.');
  }

  onModuleInit() {
    this.worker.on('active', (job: Job) => {
      this.logger.debug(`Worker: Job ${job.id} is active.`);
    });

    this.worker.on(
      'completed',
      async (job: Job<NotificationJob>, result: any) => {
        this.logger.debug(
          `Worker: Job ${job.id} completed. Result: ${JSON.stringify(result)}`,
        );
        // Update notification status to sent/delivered in database
        await this.notificationsService.updateNotificationStatus(
          job.data.notificationId,
          NotificationStatus.SENT,
        );
      },
    );

    this.worker.on('failed', async (job: Job<NotificationJob>, err: Error) => {
      this.logger.error(
        `Worker: Job ${job.id} failed with error: ${err.message}. Attempts made: ${job.attemptsMade}`,
      );
      // Update notification status to 'failed in database
      await this.notificationsService.updateNotificationStatus(
        job.data.notificationId,
        NotificationStatus.FAILED,
        err.message,
      );
    });

    this.worker.on('error', (err: Error) => {
      this.logger.error(`Worker error: ${err.message}`, err.stack);
    });
  }

  onModuleDestroy() {
    this.worker.close();
    this.logger.debug('Notification worker closed.');
  }

  private async processNotificationJob(
    job: Job<NotificationJob>,
  ): Promise<void> {
    const { notificationId, channel, recipient, subject, body } = job.data;
    this.logger.debug(
      `Processing notification job ${notificationId} for channel ${channel}`,
    );

    const sender = this.channelSenders.get(channel);
    if (!sender) {
      throw new Error(`No sender found for channel: ${channel}`);
    }

    const success = await sender.send({
      notificationId,
      recipient,
      subject,
      body,
    });

    if (!success) {
      throw new Error(`Failed to send notification via ${channel}.`);
    }
  }
}
