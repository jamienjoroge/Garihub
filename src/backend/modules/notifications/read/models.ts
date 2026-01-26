import { EventLedger, DomainEvent } from '../../../core/event-ledger/Ledger';

export interface NotificationOutboxItem {
  notificationId: string;
  userId: string;
  channel: 'email' | 'sms';
  template: 'INSPECTION_COMPLETED' | 'SERVICE_RECORD_MINTED';
  targetRef: string;
  requestedAt: string;
  status: 'PENDING';
}

export async function projectNotificationOutbox(ledger: EventLedger, tenant_id: string): Promise<NotificationOutboxItem[]> {
  const events = await ledger.replay(tenant_id);
  const requested = events.filter(e => e.event_name === 'NotificationRequested');
  const delivered = new Set<string>();
  const scheduleMap = new Map<string, { nextAttemptAt?: string; attemptNumber?: number }>();
  for (const e of events) {
    if (e.event_name === 'NotificationDelivered') {
      delivered.add((e.payload as any).notificationId);
    }
    if (e.event_name === 'NotificationRetryScheduled') {
      const nid = (e.payload as any).notificationId as string;
      scheduleMap.set(nid, { nextAttemptAt: (e.payload as any).nextAttemptAt, attemptNumber: (e.payload as any).attemptNumber });
    }
  }
  const now = new Date().toISOString();
  const outbox: NotificationOutboxItem[] = [];
  for (const r of requested as DomainEvent[]) {
    const nid = (r.payload as any).notificationId as string;
    if (delivered.has(nid)) continue;
    const sched = scheduleMap.get(nid);
    const due = !sched?.nextAttemptAt || String(sched.nextAttemptAt) <= now;
    if (!due) continue;
    outbox.push({
      notificationId: nid,
      userId: (r.payload as any).userId,
      channel: (r.payload as any).channel,
      template: (r.payload as any).template,
      targetRef: (r.payload as any).targetRef,
      requestedAt: (r.payload as any).requestedAt,
      status: 'PENDING',
    });
  }
  return outbox;
}

export interface NotificationHistoryItem {
  notificationId: string;
  userId?: string;
  channel: 'email' | 'sms';
  template?: 'INSPECTION_COMPLETED' | 'SERVICE_RECORD_MINTED';
  deliveredAt: string;
  status: 'DELIVERED' | 'FAILED';
  failureReason?: string;
  providerMessageId?: string;
  receiptStatus?: 'DELIVERED' | 'FAILED' | 'PENDING' | 'UNKNOWN';
}

export async function projectNotificationHistory(ledger: EventLedger, tenant_id: string, userId?: string): Promise<NotificationHistoryItem[]> {
  const events = await ledger.replay(tenant_id);
  const idx = new Map<string, DomainEvent>();
  for (const r of events as DomainEvent[]) {
    if (r.event_name === 'NotificationRequested') idx.set((r.payload as any).notificationId, r);
  }
  const history: NotificationHistoryItem[] = [];
  for (const ev of events as DomainEvent[]) {
    if (ev.event_name === 'NotificationDelivered') {
      const nid = (ev.payload as any).notificationId as string;
      const req = idx.get(nid);
      const item: NotificationHistoryItem = {
        notificationId: nid,
        userId: req ? (req.payload as any).userId : undefined,
        channel: (ev.payload as any).channel,
        template: req ? (req.payload as any).template : undefined,
        deliveredAt: (ev.payload as any).deliveredAt,
        status: (ev.payload as any).status,
        failureReason: (ev.payload as any).failureReason,
        providerMessageId: (ev.payload as any).providerMessageId,
      };
      if (!userId || item.userId === userId) history.push(item);
    }
    if (ev.event_name === 'NotificationDeliveryAttempted') {
      const nid = (ev.payload as any).notificationId as string;
      const req = idx.get(nid);
      const item: NotificationHistoryItem = {
        notificationId: nid,
        userId: req ? (req.payload as any).userId : undefined,
        channel: req ? (req.payload as any).channel : 'sms',
        template: req ? (req.payload as any).template : undefined,
        deliveredAt: (ev.payload as any).attemptedAt,
        status: (ev.payload as any).status,
        failureReason: (ev.payload as any).failureReason,
        providerMessageId: (ev.payload as any).providerMessageId,
      };
      if (!userId || item.userId === userId) history.push(item);
    }
    if (ev.event_name === 'DeliveryReceiptReceived') {
      const pmid = (ev.payload as any).providerMessageId as string;
      // annotate last matching history item with receipt status
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i] as any;
        if (h.providerMessageId && h.providerMessageId === pmid) {
          h.receiptStatus = (ev.payload as any).status;
          break;
        }
      }
    }
  }
  history.sort((a, b) => a.deliveredAt.localeCompare(b.deliveredAt));
  return history;
}

export async function projectNotificationSpend(ledger: EventLedger, tenant_id: string, period: string): Promise<{ channel: 'sms' | 'email'; deliveredCost: number; failedCost: number; totalCost: number }[]> {
  const events = await ledger.replay(tenant_id);
  const costs = events.filter(e => e.event_name === 'NotificationCostRecorded' && String((e.payload as any).recordedAt).slice(0, 7) === period);
  const byChannel = new Map<string, { deliveredCost: number; failedCost: number; totalCost: number }>();
  for (const c of costs as any[]) {
    const ch = c.payload.channel as 'sms' | 'email';
    const status = events.find(e => e.event_name === 'NotificationDeliveryAttempted' && String((e.payload as any).notificationId) === c.payload.notificationId && Number((e.payload as any).attemptNumber) === c.payload.attemptNumber)?.payload.status as 'DELIVERED' | 'FAILED';
    const rec = byChannel.get(ch) || { deliveredCost: 0, failedCost: 0, totalCost: 0 };
    if (status === 'DELIVERED') rec.deliveredCost = Number((rec.deliveredCost + Number(c.payload.totalCost || 0)).toFixed(2));
    else rec.failedCost = Number((rec.failedCost + Number(c.payload.totalCost || 0)).toFixed(2));
    rec.totalCost = Number((rec.totalCost + Number(c.payload.totalCost || 0)).toFixed(2));
    byChannel.set(ch, rec);
  }
  return Array.from(byChannel.entries()).map(([channel, v]) => ({ channel: channel as 'sms' | 'email', ...v }));
}

export async function projectBudgetStatus(ledger: EventLedger, tenant_id: string, period: string): Promise<{ period: string; limit: number; spent: number; remaining: number }> {
  const events = await ledger.replay(tenant_id);
  const costs = events.filter(e => e.event_name === 'NotificationCostRecorded' && String((e.payload as any).recordedAt).slice(0, 7) === period);
  const spent = costs.reduce((s, c: any) => s + Number(c.payload.totalCost || 0), 0);
  const limit = Number(process.env.NOTIF_BUDGET_LIMIT_KES || 'Infinity');
  const remaining = Number((limit - spent).toFixed(2));
  return { period, limit, spent: Number(spent.toFixed(2)), remaining };
}