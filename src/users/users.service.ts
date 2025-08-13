import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationDto } from 'src/notifications/dto/create-notification.dto';
import {
  Notification,
  NotificationStatus,
} from 'src/notifications/entities/notification.entity';
import {
  UserPreference,
  UserPreferencesJson,
} from 'src/users/entities/user-preference.entity';
import { Repository } from 'typeorm';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly userPreferenceRepository: Repository<UserPreference>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getUserPreferences(
    userId: string,
  ): Promise<UserPreferencesResponseDto> {
    let userPreference = await this.userPreferenceRepository.findOne({
      where: { user_id: userId },
    });

    if (!userPreference) {
      // If no preferences exist, return default empty preferences
      userPreference = this.userPreferenceRepository.create({
        user_id: userId,
        preferences: { global: {}, notificationTypes: {} },
      });
      await this.userPreferenceRepository.save(userPreference);
    }

    return {
      userId: userPreference.user_id,
      preferences: userPreference.preferences,
    };
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    let userPreference = await this.userPreferenceRepository.findOne({
      where: { user_id: userId },
    });

    if (!userPreference) {
      userPreference = this.userPreferenceRepository.create({
        user_id: userId,
        preferences: { global: {}, notificationTypes: {} },
      });
    }

    // Merge new preferences with existing ones
    const currentPreferences: UserPreferencesJson = userPreference.preferences;

    if (updateDto.global !== undefined) {
      currentPreferences.global = {
        ...currentPreferences.global,
        ...updateDto.global,
      };
    }

    if (updateDto.notificationTypes !== undefined) {
      currentPreferences.notificationTypes = {
        ...currentPreferences.notificationTypes,
        ...updateDto.notificationTypes,
      };
    }

    userPreference.preferences = currentPreferences;
    await this.userPreferenceRepository.save(userPreference);

    return {
      userId: userPreference.user_id,
      preferences: userPreference.preferences,
    };
  }

  async getInAppNotifications(userId: string): Promise<NotificationDto[]> {
    const inAppNotifications = await this.notificationRepository.find({
      where: {
        user_id: userId,
        channel: 'in_app',
        status: NotificationStatus.SENT,
      },
      order: {
        created_at: 'DESC',
      },
      take: 50,
    });

    return inAppNotifications.map((notification) => ({
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
}
