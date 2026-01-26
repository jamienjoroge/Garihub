export type StubResult = {
  providerMessageId: string;
  status: 'DELIVERED' | 'FAILED';
  failureReason?: string;
};

export function send(notification: {
  notificationId: string;
  template: 'INSPECTION_COMPLETED' | 'SERVICE_RECORD_MINTED';
}): StubResult {
  const providerMessageId = `STUB_${notification.notificationId}`;
  if (notification.template === 'INSPECTION_COMPLETED') {
    return { providerMessageId, status: 'DELIVERED' };
  }
  return { providerMessageId, status: 'FAILED', failureReason: 'STUB_FAILURE' };
}