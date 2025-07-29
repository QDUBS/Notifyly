export interface NotificationPayload {
  notificationId: string;
  recipient: string;
  subject?: string;
  body: string;
}

export interface ChannelSender {
  send(payload: NotificationPayload): Promise<boolean>;
}
