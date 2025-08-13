import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EventNotificationMapping } from 'src/events/entities/event-notification-mapping.entity';
import { NotificationTemplate } from 'src/notifications/entities/notification-template.entity';
import {
  Notification,
  NotificationStatus,
} from 'src/notifications/entities/notification.entity';
import {
  UserPreference,
  UserPreferencesJson,
} from 'src/users/entities/user-preference.entity';
import { HandlebarsService } from 'src/utils/handlebars/handlebars.service';
import { QueueService } from 'src/utils/queue/queue.service';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(EventNotificationMapping)
    private readonly mappingRepository: Repository<EventNotificationMapping>,
    @InjectRepository(UserPreference)
    private readonly userPreferenceRepository: Repository<UserPreference>,
    private readonly queueService: QueueService,
    private readonly handlebarsService: HandlebarsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async processEvent(eventType: string, payload: any): Promise<void> {
    this.logger.debug(
      `Processing event: ${eventType} with payload: ${JSON.stringify(payload)}`,
    );

    const { userId, email, phoneNumber, ...templateData } = payload;

    if (!userId) {
      this.logger.warn(
        `Event ${eventType} received without a userId. Skipping notification processing.`,
      );
      return;
    }

    // Get event-to-notification mapping
    const mapping = await this.mappingRepository.findOne({
      where: { event_type: eventType },
      relations: ['template_email', 'template_sms', 'template_in_app'],
    });

    if (!mapping) {
      this.logger.warn(
        `No notification mapping found for event type: ${eventType}.`,
      );
      return;
    }

    // Get user preferences
    const userPreferences = await this.userPreferenceRepository.findOne({
      where: { user_id: userId },
    });
    const preferences: UserPreferencesJson = userPreferences
      ? userPreferences.preferences
      : { global: {}, notificationTypes: {} };

    // Determine effective channels based on mapping defaults and user preferences
    const channelsToSend: string[] = [];
    for (const defaultChannel of mapping.default_channels) {
      const isGlobalEnabled =
        preferences.global?.[
          defaultChannel as keyof typeof preferences.global
        ] !== false;
      const isTypeEnabled =
        preferences.notificationTypes?.[eventType]?.[
          defaultChannel as keyof typeof preferences.global
        ] !== false;

      if (isGlobalEnabled && isTypeEnabled) {
        channelsToSend.push(defaultChannel);
      } else {
        this.logger.debug(
          `Channel ${defaultChannel} for event ${eventType} skipped due to user preferences.`,
        );
      }
    }

    if (channelsToSend.length === 0) {
      this.logger.debug(
        `No channels enabled for user ${userId} for event ${eventType} after applying preferences.`,
      );
      return;
    }

    // Prepare and enqueue notifications for each determined channel
    for (const channel of channelsToSend) {
      let template: NotificationTemplate;
      let recipient: string;

      switch (channel) {
        case 'email':
          template = mapping.template_email;
          recipient = email;
          break;
        case 'sms':
          template = mapping.template_sms;
          recipient = phoneNumber;
          break;
        case 'in_app':
          template = mapping.template_in_app;
          recipient = userId;
          break;
        default:
          this.logger.warn(
            `Unsupported channel: ${channel} for event ${eventType}. Skipping.`,
          );
          continue;
      }

      if (!template || !recipient) {
        this.logger.warn(
          `Missing template or recipient for channel ${channel} for event ${eventType}. Skipping.`,
        );
        continue;
      }

      // Render the notification content using Handlebars
      const renderedBody = this.handlebarsService.renderTemplate(
        template.body_template,
        payload,
      );
      const renderedSubject = template.subject_template
        ? this.handlebarsService.renderTemplate(
            template.subject_template,
            payload,
          )
        : null;

      // Create a notification record in the database with PENDING status
      const notificationRecord = this.notificationRepository.create({
        user_id: userId,
        event_type: eventType,
        correlation_id:
          payload.correlationId || payload.orderId || payload.invoiceId || null,
        channel: channel,
        status: NotificationStatus.PENDING,
        subject: renderedSubject,
        body: renderedBody,
      });

      try {
        const savedNotification =
          await this.notificationRepository.save(notificationRecord);
        this.logger.debug(
          `Notification record created: ${savedNotification.id} for user ${userId} via ${channel}`,
        );

        // Enqueue the job to BullMQ
        await this.queueService.addNotificationJob({
          notificationId: savedNotification.id,
          channel: channel,
          recipient: recipient,
          subject: renderedSubject!,
          body: renderedBody,
        });
        this.logger.debug(
          `Notification job enqueued for ID: ${savedNotification.id}`,
        );
      } catch (dbError) {
        this.logger.error(
          `Failed to save notification record or enqueue job: ${dbError.message}`,
          dbError.stack,
        );
      }
    }
  }

  /**
   * Updates the status of a notification record.
   * This is typically called by the NotificationWorker after attempting delivery.
   * @param notificationId The ID of the notification record.
   * @param status The new status.
   * @param errorDetails Optional error message if delivery failed.
   */
  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    errorDetails?: string,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });
    if (notification) {
      notification.status = status;
      if (
        status === NotificationStatus.SENT ||
        status === NotificationStatus.DELIVERED
      ) {
        notification.sent_at = new Date();
        notification.failed_at = null;
        notification.error_details = null;
      } else if (status === NotificationStatus.FAILED) {
        notification.failed_at = new Date();
        notification.error_details = errorDetails!;
        notification.retries_count += 1; // Increment retry count on failure
      }
      await this.notificationRepository.save(notification);
      this.logger.debug(
        `Notification ${notificationId} status updated to ${status}`,
      );
    } else {
      this.logger.warn(
        `Notification with ID ${notificationId} not found for status update.`,
      );
    }
  }

  /**
   * Retrieves a notification by its ID.
   * @param notificationId The ID of the notification.
   */
  async getNotificationById(
    notificationId: string,
  ): Promise<Notification | null | undefined> {
    return this.notificationRepository.findOne({
      where: { id: notificationId },
    });
  }
 
  /**
   * Retrieves notifications based on filters.
   * @param filters Filtering criteria (status, type, channel, userId, correlationId).
   */
  async getNotificationsByFilters(filters: {
    status?: NotificationStatus;
    eventType?: string;
    channel?: string;
    userId?: string;
    correlationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    const queryBuilder =
      this.notificationRepository.createQueryBuilder('notification');

    if (filters.status) {
      queryBuilder.andWhere('notification.status = :status', {
        status: filters.status,
      });
    }
    if (filters.eventType) {
      queryBuilder.andWhere('notification.event_type = :eventType', {
        eventType: filters.eventType,
      });
    }
    if (filters.channel) {
      queryBuilder.andWhere('notification.channel = :channel', {
        channel: filters.channel,
      });
    }
    if (filters.userId) {
      queryBuilder.andWhere('notification.user_id = :userId', {
        userId: filters.userId,
      });
    }
    if (filters.correlationId) {
      queryBuilder.andWhere('notification.correlation_id = :correlationId', {
        correlationId: filters.correlationId,
      });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('notification.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('notification.created_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('notification.created_at', 'DESC');

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }
    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    return queryBuilder.getMany();
  }
}
