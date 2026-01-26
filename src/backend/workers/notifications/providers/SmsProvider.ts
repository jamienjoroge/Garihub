import { INotificationProvider, ProviderResult } from './INotificationProvider';

export class SmsProvider implements INotificationProvider {
  private apiKey?: string;
  private senderId?: string;
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID;
  }
  async send(notification: {
    notificationId: string;
    userId: string;
    channel: 'email' | 'sms';
    template: 'INSPECTION_COMPLETED' | 'SERVICE_RECORD_MINTED';
    targetRef: string;
    payload: Record<string, unknown>;
  }): Promise<ProviderResult> {
    const providerMessageId = `SMS_${notification.notificationId}`;
    if (notification.channel !== 'sms') {
      return { providerMessageId, status: 'FAILED', failureReason: 'UNSUPPORTED_CHANNEL' };
    }
    if (!this.apiKey || !this.senderId) {
      return { providerMessageId, status: 'FAILED', failureReason: 'MISSING_PROVIDER_CONFIG' };
    }
    return { providerMessageId, status: 'DELIVERED' };
  }
}