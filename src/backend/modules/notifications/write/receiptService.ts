import { EventLedger } from '../../../core/event-ledger/Ledger';
import { createHash } from 'crypto';

export class ReceiptService {
  constructor(private ledger: EventLedger) {}

  async recordReceipt(payload: any, metadata: { tenant_id: string; branch_id: string; user_id: string; timestamp: string; correlation_id: string }) {
    const providerMessageId = String(payload?.providerMessageId || '');
    const status = String(payload?.status || 'UNKNOWN').toUpperCase();
    const rawStatus = String(payload?.rawStatus || payload?.status || '');
    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const events = await this.ledger.replay(metadata.tenant_id);
    const attempted = events.find(e => e.event_name === 'NotificationDeliveryAttempted' && String((e.payload as any).providerMessageId) === providerMessageId);
    const notificationId = attempted ? (attempted.payload as any).notificationId : null;
    const normalized: 'DELIVERED' | 'FAILED' | 'PENDING' | 'UNKNOWN' =
      status.includes('DELIV') ? 'DELIVERED' : status.includes('FAIL') ? 'FAILED' : status.includes('PEND') ? 'PENDING' : 'UNKNOWN';
    return this.ledger.append('DeliveryReceiptReceived', metadata, {
      notificationId,
      providerMessageId,
      status: normalized,
      receivedAt: metadata.timestamp,
      rawStatus,
      rawPayloadHash: hash,
      channel: 'sms',
    });
  }
}