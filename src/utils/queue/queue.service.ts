import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

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
    const redisUrl =
      this.configService.get<string>('redis.host') ?? 'redis://localhost:6379';
    this.notificationQueue = new Queue<NotificationJob>('notifications', {
      connection: {
        host: new URL(redisUrl).hostname,
        port: parseInt(new URL(redisUrl).port || '6379', 10),
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
