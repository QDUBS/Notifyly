import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { REDIS_PORT, REDIS_URL } from 'src/secrets/config';

export interface NotificationJob {
  notificationId: string;
  channel: string;
  recipient: string;
  subject?: string;
  body: string;
  retries?: number;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private notificationQueue: Queue<NotificationJob>;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? REDIS_URL;
    const redisPort =
      this.configService.get<string>('REDIS_PORT') ?? REDIS_PORT;

    this.notificationQueue = new Queue<NotificationJob>('notifications', {
      connection: {
        host: new URL(redisUrl).hostname,
        port: parseInt(redisPort || '6379', 10),
      },
      defaultJobOptions: {
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    this.logger.debug('Notification queue initialized.');
  }

  onModuleInit() {}

  onModuleDestroy() {
    this.notificationQueue.close();
    this.logger.debug('Notification queue closed.');
  }

  async addNotificationJob(jobData: NotificationJob): Promise<void> {
    await this.notificationQueue.add(
      `send-notification-${jobData.notificationId}`,
      jobData,
      {
        jobId: jobData.notificationId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async getJob(jobId: string) {
    return this.notificationQueue.getJob(jobId);
  }

  async retryJob(jobId: string): Promise<boolean> {
    const job = await this.notificationQueue.getJob(jobId);
    if (job) {
      this.logger.debug(`Manually retrying job ${jobId}`);
      await job.retry();
      return true;
    }
    this.logger.warn(`Job ${jobId} not found for retry.`);
    return false;
  }
}
