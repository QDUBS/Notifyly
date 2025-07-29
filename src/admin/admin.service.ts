import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationFilterDto } from '../notifications/dto/notification-filter.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { QueueService } from 'src/utils/queue/queue.service';
import { NotificationDto } from 'src/notifications/dto/create-notification.dto';
import { NotificationStatus } from 'src/notifications/entities/notification.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly queueService: QueueService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getNotifications(
    filterDto: NotificationFilterDto,
  ): Promise<NotificationDto[]> {
    const notifications =
      await this.notificationsService.getNotificationsByFilters({
        status: filterDto.status,
        eventType: filterDto.eventType,
        channel: filterDto.channel,
        userId: filterDto.userId,
        correlationId: filterDto.correlationId,
        startDate: filterDto.startDate
          ? new Date(filterDto.startDate)
          : undefined,
        endDate: filterDto.endDate ? new Date(filterDto.endDate) : undefined,
        limit: filterDto.limit,
        offset: filterDto.offset,
      });

    return notifications.map((notification) => ({
      id: notification.id,
      userId: notification.user_id,
      eventType: notification.event_type,
      correlationId: notification.correlation_id,
      channel: notification.channel,
      status: notification.status,
      subject: notification.subject!,
      body: notification.body!,
      sentAt: notification.sent_at,
      failedAt: notification.failed_at!,
      errorDetails: notification.error_details!,
      retriesCount: notification.retries_count,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
    }));
  }

  async getNotificationDetails(
    notificationId: string,
  ): Promise<NotificationDto> {
    const notification =
      await this.notificationsService.getNotificationById(notificationId);
    if (!notification) {
      throw new NotFoundException(
        `Notification with ID "${notificationId}" not found.`,
      );
    }
    return {
      id: notification.id,
      userId: notification.user_id,
      eventType: notification.event_type,
      correlationId: notification.correlation_id,
      channel: notification.channel,
      status: notification.status,
      subject: notification.subject!,
      body: notification.body!,
      sentAt: notification.sent_at,
      failedAt: notification.failed_at!,
      errorDetails: notification.error_details!,
      retriesCount: notification.retries_count,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
    };
  }

  async retryFailedNotification(notificationId: string): Promise<void> {
    const notification =
      await this.notificationsService.getNotificationById(notificationId);

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID "${notificationId}" not found.`,
      );
    }

    if (notification.status !== NotificationStatus.FAILED) {
      throw new BadRequestException(
        `Notification ${notificationId} is not in FAILED status and cannot be retried.`,
      );
    }

    this.logger.debug(
      `Retrying notification ${notificationId} (current retries: ${notification.retries_count})`,
    );

    // Update status to 'pending/retried' before enqueuing
    await this.notificationsService.updateNotificationStatus(
      notificationId,
      NotificationStatus.RETRIED,
      'Retrying by admin request',
    );

    // Renqueue the job with its original details
    await this.queueService.addNotificationJob({
      notificationId: notification.id,
      channel: notification.channel,
      recipient:
        notification.channel === 'in_app'
          ? notification.user_id
          : notification.channel === 'email'
            ? notification.subject!
            : notification.body!,
      subject: notification.subject!,
      body: notification.body!,
      retries: notification.retries_count,
    });
    this.logger.debug(`Notification ${notificationId} re-enqueued for retry.`);
  }
}
