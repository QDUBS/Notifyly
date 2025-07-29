import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ChannelSender, NotificationPayload } from './channel.interface';

@Injectable()
export class InAppService implements ChannelSender {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async send(payload: NotificationPayload): Promise<boolean> {
    const { notificationId, recipient, body } = payload;
    this.logger.debug(
      `Processing in-app notification ${notificationId} for user ${recipient}`,
    );

    this.logger.debug(
      `In-app notification ${notificationId} marked as sent for user ${recipient}. Content: "${body.substring(0, 50)}..."`,
    );
    return true;
  }
}
