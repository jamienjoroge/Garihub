import { EventLedger, DomainEvent } from '../../core/event-ledger/Ledger.ts';

export interface InboxItem {
  notificationId: string;
  template: string;
  channel: 'sms' | 'email';
  requestedAt: string;
  latestStatus: 'PENDING' | 'DELIVERED' | 'FAILED' | 'RETRYING' | 'RATE_LIMITED' | 'BUDGET_EXCEEDED';
  lastUpdatedAt: string;
  proofLinkAvailable: boolean;
}

export async function projectUserNotificationInbox(ledger: EventLedger, tenant_id: string, userId: string, period?: string): Promise<InboxItem[]> {
  const events = await ledger.replay(tenant_id);
  const requested = events.filter(e => e.event_name === 'NotificationRequested' && String((e.payload as any).userId) === userId && (!period || String((e.payload as any).requestedAt).slice(0,7) === period)) as DomainEvent[];
  const items: InboxItem[] = [];
  for (const r of requested) {
    const id = String((r.payload as any).notificationId);
    const attempts = events.filter(e => e.event_name === 'NotificationDeliveryAttempted' && String((e.payload as any).notificationId) === id) as DomainEvent[];
    const delivered = events.find(e => e.event_name === 'NotificationDelivered' && String((e.payload as any).notificationId) === id) as DomainEvent | undefined;
    const lastAttempt = attempts.length ? attempts[attempts.length - 1] : undefined;
    let latestStatus: InboxItem['latestStatus'] = 'PENDING';
    let lastUpdatedAt = (r.payload as any).requestedAt;
    if (delivered) {
      latestStatus = (delivered.payload as any).status === 'DELIVERED' ? 'DELIVERED' : 'FAILED';
      lastUpdatedAt = (delivered.payload as any).deliveredAt;
    } else if (lastAttempt) {
      const fr = String((lastAttempt.payload as any).failureReason || '');
      if (fr === 'RATE_LIMITED') latestStatus = 'RATE_LIMITED';
      else if (fr === 'BUDGET_EXCEEDED') latestStatus = 'BUDGET_EXCEEDED';
      else if ((lastAttempt.payload as any).status === 'FAILED') latestStatus = 'FAILED';
      else latestStatus = 'RETRYING';
      lastUpdatedAt = (lastAttempt.payload as any).attemptedAt;
    }
    const proofGranted = events.some(e => e.event_name === 'NotificationProofAccessGranted' && String((e.payload as any).notificationId) === id);
    items.push({
      notificationId: id,
      template: String((r.payload as any).template),
      channel: (r.payload as any).channel,
      requestedAt: (r.payload as any).requestedAt,
      latestStatus,
      lastUpdatedAt,
      proofLinkAvailable: proofGranted,
    });
  }
  return items;
}