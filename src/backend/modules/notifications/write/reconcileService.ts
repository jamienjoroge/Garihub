import { EventLedger, DomainEvent } from '../../../core/event-ledger/Ledger';
import { normalizeSmsFailure } from '../../../workers/notifications/providers/normalizeSmsFailure';

export class ReconcileService {
  async run(ledger: EventLedger, tenant_id: string, nowIso: string) {
    const events = await ledger.replay(tenant_id);
    const receipts = events.filter(e => e.event_name === 'DeliveryReceiptReceived');
    for (const r of receipts as DomainEvent[]) {
      const pmid = (r.payload as any).providerMessageId as string;
      const attempt = [...events].reverse().find(e => e.event_name === 'NotificationDeliveryAttempted' && String((e.payload as any).providerMessageId) === pmid) as DomainEvent | undefined;
      const priorStatus = attempt ? ((attempt.payload as any).status as any) : 'UNKNOWN';
      const receiptStatus = (r.payload as any).status as any;
      const notificationId = attempt ? (attempt.payload as any).notificationId : null;
      const attemptNumber = attempt ? Number((attempt.payload as any).attemptNumber || 0) : null;
      let action: 'NO_ACTION' | 'MARK_FAILED' | 'SCHEDULE_RETRY' = 'NO_ACTION';
      let reason = 'MATCHED';
      if (priorStatus !== receiptStatus) {
        if (receiptStatus === 'FAILED') {
          const req = notificationId ? events.find(e => e.event_name === 'NotificationRequested' && String((e.payload as any).notificationId) === notificationId) : undefined;
          const userId = req ? (req.payload as any).userId : undefined;
          const retryable = normalizeSmsFailure({ failureReason: (attempt?.payload as any)?.failureReason || 'PROVIDER_EXCEPTION' }).retryable;
          if (retryable && userId && !this.isRateLimited(events, userId, nowIso)) {
            action = 'SCHEDULE_RETRY';
            reason = 'RECEIPT_FAILED_RETRYABLE';
            await ledger.append('NotificationRetryScheduled', r.metadata, {
              notificationId: notificationId || (attempt?.payload as any)?.notificationId,
              nextAttemptAt: new Date(Date.now() + 5 * 60_000).toISOString(),
              attemptNumber: (attemptNumber || 0) + 1,
            });
          } else {
            action = 'MARK_FAILED';
            reason = retryable ? 'RATE_LIMITED_OR_NO_USER' : 'NON_RETRYABLE';
          }
        } else {
          action = 'NO_ACTION';
          reason = 'RECEIPT_DELIVERED_BUT_PRIOR_FAILED_OR_UNKNOWN';
        }
      }
      await ledger.append('NotificationDeliveryReconciled', r.metadata, {
        notificationId,
        providerMessageId: pmid,
        attemptNumber,
        priorStatus,
        receiptStatus,
        reconciledAt: nowIso,
        action,
        reason,
      });
    }
  }

  private isRateLimited(events: DomainEvent[], userId: string, nowIso: string) {
    const day = nowIso.slice(0, 10);
    const todays = events.filter(e => e.event_name === 'NotificationDeliveryAttempted' && String(e.metadata?.timestamp || '').slice(0, 10) === day && String((e.payload as any).userId || '') === userId);
    return todays.length >= 3;
  }
}