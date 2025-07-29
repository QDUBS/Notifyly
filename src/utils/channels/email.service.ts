import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as nodemailer from 'nodemailer';
import { ChannelSender, NotificationPayload } from './channel.interface';

@Injectable()
export class EmailService implements ChannelSender {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const emailConfig = this.configService.get('channels.email');
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
    this.fromAddress = emailConfig.from;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    const { notificationId, recipient, subject, body } = payload;
    this.logger.debug(
      `Attempting to send email notification ${notificationId} to ${recipient}`,
    );

    if (!recipient || !subject || !body) {
      this.logger.error(
        `Email payload incomplete for ${notificationId}. Recipient, subject, or body missing.`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: recipient,
        subject: subject,
        html: body,
      });
      this.logger.debug(
        `Email notification ${notificationId} sent successfully to ${recipient}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email notification ${notificationId} to ${recipient}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
