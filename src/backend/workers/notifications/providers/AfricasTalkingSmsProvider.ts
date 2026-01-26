import { INotificationProvider, ProviderResult } from './INotificationProvider';
import { normalizeSmsFailure } from './normalizeSmsFailure';

export class AfricasTalkingSmsProvider implements INotificationProvider {
  private apiKey?: string;
  private username?: string;
  private senderId?: string;
  private endpoint: string;
  constructor() {
    this.apiKey = process.env.AT_API_KEY;
    this.username = process.env.AT_USERNAME;
    this.senderId = process.env.SMS_SENDER_ID;
    this.endpoint = process.env.AT_SMS_ENDPOINT || 'https://api.africastalking.com/version1/messaging';
  }

  async send(notification: {
    notificationId: string;
    userId: string;
    channel: 'email' | 'sms';
    template: 'INSPECTION_COMPLETED' | 'SERVICE_RECORD_MINTED';
    targetRef: string;
    payload: Record<string, unknown>;
  }): Promise<ProviderResult> {
    const providerMessageId = `AT_${notification.notificationId}`;
    if (notification.channel !== 'sms') {
      return { providerMessageId, status: 'FAILED', failureReason: 'UNSUPPORTED_CHANNEL' };
    }
    if (!this.apiKey || !this.username || !this.senderId) {
      return { providerMessageId, status: 'FAILED', failureReason: 'MISSING_PROVIDER_CONFIG' };
    }
    try {
      const to = String(notification.payload?.phone || '');
      const message = String(notification.payload?.message || '');
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'apiKey': this.apiKey,
        },
        body: new URLSearchParams({ username: this.username, to, message, from: this.senderId }).toString(),
      });
      if (!res.ok) {
        const { failureReason } = normalizeSmsFailure({ httpStatus: res.status });
        return { providerMessageId, status: 'FAILED', failureReason };
      }
      const json = await res.json().catch(() => ({}));
      const statusText = json?.SMSMessageData?.Recipients?.[0]?.status as string | undefined;
      if (statusText && /Success/i.test(statusText)) {
        return { providerMessageId, status: 'DELIVERED' };
      }
      const { failureReason } = normalizeSmsFailure({ message: statusText || 'UNKNOWN' });
      return { providerMessageId, status: 'FAILED', failureReason };
    } catch (err) {
      const { failureReason } = normalizeSmsFailure({ failureReason: 'PROVIDER_EXCEPTION' });
      return { providerMessageId, status: 'FAILED', failureReason };
    }
  }
}