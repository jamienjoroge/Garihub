import { EventLedger, DomainEvent } from '../../core/event-ledger/Ledger';

export async function projectNotificationProof(ledger: EventLedger, tenant_id: string, notificationId: string) {
  const events = await ledger.replay(tenant_id);
  const requested = events.find(e => e.event_name === 'NotificationRequested' && String((e.payload as any).notificationId) === notificationId) as DomainEvent | undefined;
  const attempts = events.filter(e => e.event_name === 'NotificationDeliveryAttempted' && String((e.payload as any).notificationId) === notificationId) as DomainEvent[];
  const costs = events.filter(e => e.event_name === 'NotificationCostRecorded' && String((e.payload as any).notificationId) === notificationId) as DomainEvent[];
  const receipts = events.filter(e => e.event_name === 'DeliveryReceiptReceived' && ((e.payload as any).notificationId === notificationId || attempts.some(a => (a.payload as any).providerMessageId && (a.payload as any).providerMessageId === (e.payload as any).providerMessageId))) as DomainEvent[];
  const reconciliations = events.filter(e => e.event_name === 'NotificationDeliveryReconciled' && ((e.payload as any).notificationId === notificationId || attempts.some(a => (a.payload as any).providerMessageId && (a.payload as any).providerMessageId === (e.payload as any).providerMessageId))) as DomainEvent[];
  const final = [...events].reverse().find(e => e.event_name === 'NotificationDelivered' && String((e.payload as any).notificationId) === notificationId) as DomainEvent | undefined;
  const requestedView = requested ? { notificationId, userId: (requested.payload as any).userId, channel: (requested.payload as any).channel, template: (requested.payload as any).template, targetRef: (requested.payload as any).targetRef, requestedAt: (requested.payload as any).requestedAt } : undefined;
  const attemptsView = attempts.map(a => ({ attemptNumber: (a.payload as any).attemptNumber, status: (a.payload as any).status, failureReason: (a.payload as any).failureReason, providerMessageId: (a.payload as any).providerMessageId, cost: (costs.find(c => Number((c.payload as any).attemptNumber) === Number((a.payload as any).attemptNumber))?.payload as any)?.totalCost || 0 }));
  const receiptsView = receipts.map(r => ({ providerMessageId: (r.payload as any).providerMessageId, receiptStatus: (r.payload as any).status, receivedAt: (r.payload as any).receivedAt, rawStatus: (r.payload as any).rawStatus }));
  const reconciliationsView = reconciliations.map(rc => ({ action: (rc.payload as any).action, reason: (rc.payload as any).reason, reconciledAt: (rc.payload as any).reconciledAt }));
  const finalOutcome = final ? { status: (final.payload as any).status, deliveredAt: (final.payload as any).deliveredAt, providerMessageId: (final.payload as any).providerMessageId } : undefined;
  return { requested: requestedView, attempts: attemptsView, receipts: receiptsView, reconciliations: reconciliationsView, finalOutcome };
}

export async function projectUserNotificationProof(ledger: EventLedger, tenant_id: string, userId: string, period: string) {
  const events = await ledger.replay(tenant_id);
  const requested = events.filter(e => e.event_name === 'NotificationRequested' && String((e.payload as any).userId) === userId && String((e.payload as any).requestedAt).slice(0, 7) === period) as DomainEvent[];
  const ids = requested.map(r => String((r.payload as any).notificationId));
  const delivered = events.filter(e => e.event_name === 'NotificationDelivered' && ids.includes(String((e.payload as any).notificationId))) as DomainEvent[];
  const attempted = events.filter(e => e.event_name === 'NotificationDeliveryAttempted' && ids.includes(String((e.payload as any).notificationId))) as DomainEvent[];
  const scheduled = events.filter(e => e.event_name === 'NotificationRetryScheduled' && ids.includes(String((e.payload as any).notificationId))) as DomainEvent[];
  const costs = events.filter(e => e.event_name === 'NotificationCostRecorded' && ids.includes(String((e.payload as any).notificationId)) && String((e.payload as any).recordedAt).slice(0, 7) === period) as DomainEvent[];
  const deliveredCount = delivered.length;
  const failedCount = attempted.filter(a => (a.payload as any).status === 'FAILED').length;
  const retriedCount = scheduled.length;
  const rateLimitedCount = attempted.filter(a => (a.payload as any).failureReason === 'RATE_LIMITED').length;
  const budgetBlockedCount = attempted.filter(a => (a.payload as any).failureReason === 'BUDGET_EXCEEDED').length;
  const totalSpend = Number(costs.reduce((s, c: any) => s + Number(c.payload.totalCost || 0), 0).toFixed(2));
  const topFailure = new Map<string, number>();
  for (const a of attempted) {
    const fr = String((a.payload as any).failureReason || '');
    if (!fr) continue;
    topFailure.set(fr, (topFailure.get(fr) || 0) + 1);
  }
  const topFailureReasons = Array.from(topFailure.entries()).sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count }));
  return { summary: { delivered: deliveredCount, failed: failedCount, retried: retriedCount, rate_limited: rateLimitedCount, budget_blocked: budgetBlockedCount, total_spend: totalSpend }, topFailureReasons, notificationIds: ids };
}