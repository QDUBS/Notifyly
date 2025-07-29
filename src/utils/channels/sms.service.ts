import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as twilio from 'twilio';
import { ChannelSender, NotificationPayload } from './channel.interface';

@Injectable()
export class SmsService implements ChannelSender {
  private twilioClient: twilio.Twilio;
  private fromNumber: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const twilioConfig = this.configService.get('channels.twilio');
    this.twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    this.fromNumber = twilioConfig.fromNumber;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    const { notificationId, recipient, body } = payload;
    this.logger.debug(
      `Attempting to send SMS notification ${notificationId} to ${recipient}`,
    );

    if (!recipient || !body) {
      this.logger.error(
        `SMS payload incomplete for ${notificationId}. Recipient or body missing.`,
      );
      return false;
    }

    try {
      await this.twilioClient.messages.create({
        body: body,
        to: recipient,
        from: this.fromNumber,
      });
      this.logger.debug(
        `SMS notification ${notificationId} sent successfully to ${recipient}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send SMS notification ${notificationId} to ${recipient}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
