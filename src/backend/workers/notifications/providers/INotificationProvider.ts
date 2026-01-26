export type ProviderResult = {
  providerMessageId: string;
  status: 'DELIVERED' | 'FAILED';
  failureReason?: string;
};

export interface INotificationProvider {
  send(notification: {
    notificationId: string;
    userId: string;
    channel: 'email' | 'sms';
    template: 'INSPECTION_COMPLETED' | 'SERVICE_RECORD_MINTED';
    targetRef: string;
    payload: Record<string, unknown>;
  }): Promise<ProviderResult>;
}