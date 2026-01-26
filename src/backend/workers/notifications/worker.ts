import { EventLedger, DomainEvent } from '../../core/event-ledger/Ledger';
import { projectNotificationOutbox } from '../../modules/notifications/read/models';
import { send as stubSend } from './providerStub';
import { INotificationProvider } from './providers/INotificationProvider';
import { normalizeSmsFailure } from './providers/normalizeSmsFailure';

export async function runNotificationsWorker(ledger: EventLedger, tenant_id: string, provider?: INotificationProvider) {
  const outbox = await projectNotificationOutbox(ledger, tenant_id);
  const events = await ledger.replay(tenant_id);
  const deliveredIds = new Set<string>(
    events.filter(e => e.event_name === 'NotificationDelivered').map(e => String((e.payload as any).notificationId))
  );
  function attemptsFor(nid: string) {
    return events.filter(e => e.event_name === 'NotificationDeliveryAttempted' && String((e.payload as any).notificationId) === nid) as DomainEvent[];
  }
  function latestAttemptNumber(nid: string) {
    const atts = attemptsFor(nid);
    if (!atts.length) return 0;
    return Math.max(...atts.map(a => Number((a.payload as any).attemptNumber || 0)));
  }
  function isRateLimited(userId: string, onDay: string) {
    const day = onDay.slice(0, 10);
    const todays = events.filter(e => e.event_name === 'NotificationDeliveryAttempted' && String(e.metadata?.timestamp || '').slice(0, 10) === day && String((e.payload as any).status) !== 'RATE_LIMITED' && String((e.payload as any).userId || '') === userId);
    return todays.length >= 3;
  }
  function unitCost(channel: 'sms' | 'email') {
    const sms = Number(process.env.SMS_UNIT_COST_KES || '1');
    const email = Number(process.env.EMAIL_UNIT_COST_KES || '0');
    return channel === 'sms' ? sms : email;
  }
  function periodOf(ts: string) {
    return ts.slice(0, 7);
  }
  function spendToDate(tenant: string, period: string) {
    const costs = events.filter(e => e.event_name === 'NotificationCostRecorded' && String((e.payload as any).tenant_id) === tenant && String((e.payload as any).recordedAt).slice(0, 7) === period);
    return costs.reduce((s, c: any) => s + Number(c.payload.totalCost || 0), 0);
  }
  function budgetLimit() {
    return Number(process.env.NOTIF_BUDGET_LIMIT_KES || 'Infinity');
  }
  function hasCostForAttempt(nid: string, attemptNumber: number) {
    return events.some(e => e.event_name === 'NotificationCostRecorded' && String((e.payload as any).notificationId) === nid && Number((e.payload as any).attemptNumber) === attemptNumber);
  }
  function hasBudgetExceededForPeriod(tenant: string, period: string) {
    return events.some(e => e.event_name === 'TenantNotificationBudgetExceeded' && String((e.payload as any).tenant_id) === tenant && String((e.payload as any).period) === period);
  }
  for (const n of outbox) {
    if (deliveredIds.has(n.notificationId)) continue;
    const req = (events as DomainEvent[]).find(e => e.event_name === 'NotificationRequested' && String((e.payload as any).notificationId) === n.notificationId);
    if (!req) continue;
    const nextAttempt = latestAttemptNumber(n.notificationId) + 1;
    if (attemptsFor(n.notificationId).some(a => Number((a.payload as any).attemptNumber) === nextAttempt)) continue;
    const nowIso = new Date().toISOString();
    if (isRateLimited(String((req.payload as any).userId), nowIso)) {
      await ledger.append('NotificationDeliveryAttempted', req.metadata, {
        notificationId: n.notificationId,
        attemptNumber: nextAttempt,
        status: 'FAILED',
        failureReason: 'RATE_LIMITED',
        attemptedAt: nowIso,
      });
      if (!hasCostForAttempt(n.notificationId, nextAttempt)) {
        await ledger.append('NotificationCostRecorded', req.metadata, {
          notificationId: n.notificationId,
          attemptNumber: nextAttempt,
          tenant_id: req.metadata.tenant_id,
          channel: n.channel,
          unitCost: 0,
          currency: 'KES',
          totalCost: 0,
          recordedAt: nowIso,
        });
      }
      continue;
    }
    const period = periodOf(nowIso);
    const projectedSpend = spendToDate(req.metadata.tenant_id, period) + unitCost(n.channel);
    if (projectedSpend > budgetLimit()) {
      await ledger.append('NotificationDeliveryAttempted', req.metadata, {
        notificationId: n.notificationId,
        attemptNumber: nextAttempt,
        status: 'FAILED',
        failureReason: 'BUDGET_EXCEEDED',
        attemptedAt: nowIso,
      });
      if (!hasCostForAttempt(n.notificationId, nextAttempt)) {
        await ledger.append('NotificationCostRecorded', req.metadata, {
          notificationId: n.notificationId,
          attemptNumber: nextAttempt,
          tenant_id: req.metadata.tenant_id,
          channel: n.channel,
          unitCost: 0,
          currency: 'KES',
          totalCost: 0,
          recordedAt: nowIso,
        });
      }
      if (!hasBudgetExceededForPeriod(req.metadata.tenant_id, period)) {
        await ledger.append('TenantNotificationBudgetExceeded', req.metadata, {
          tenant_id: req.metadata.tenant_id,
          period,
          budgetLimit: budgetLimit(),
          spendToDate: spendToDate(req.metadata.tenant_id, period),
          exceededAt: nowIso,
        });
      }
      continue;
    }
    let res;
    try {
      if (provider) {
        res = await provider.send({
          notificationId: n.notificationId,
          userId: (req.payload as any).userId,
          channel: n.channel,
          template: (req.payload as any).template,
          targetRef: (req.payload as any).targetRef,
          payload: (req.payload as any).payload,
        });
      } else {
        res = stubSend({ notificationId: n.notificationId, template: (req.payload as any).template });
      }
    } catch {
      res = { providerMessageId: `ERR_${n.notificationId}`, status: 'FAILED', failureReason: 'PROVIDER_EXCEPTION' };
    }
    const md = req.metadata;
    let normalized = { failureReason: res.failureReason, retryable: false };
    if (res.status === 'FAILED') normalized = normalizeSmsFailure({ failureReason: res.failureReason });
    await ledger.append('NotificationDeliveryAttempted', md, {
      notificationId: n.notificationId,
      attemptNumber: nextAttempt,
      status: res.status,
      failureReason: normalized.failureReason,
      providerMessageId: res.providerMessageId,
      attemptedAt: nowIso,
    });
    if (!hasCostForAttempt(n.notificationId, nextAttempt)) {
      const cost = unitCost(n.channel);
      await ledger.append('NotificationCostRecorded', md, {
        notificationId: n.notificationId,
        attemptNumber: nextAttempt,
        tenant_id: md.tenant_id,
        channel: n.channel,
        unitCost: cost,
        currency: 'KES',
        totalCost: cost,
        recordedAt: nowIso,
      });
    }
    const retryable = res.status === 'FAILED' && normalized.retryable;
    const maxRetries = 3;
    if (res.status === 'DELIVERED' || !retryable || nextAttempt >= maxRetries) {
      await ledger.append('NotificationDelivered', {
        tenant_id: md.tenant_id,
        branch_id: md.branch_id,
        user_id: md.user_id,
        timestamp: new Date().toISOString(),
        correlation_id: md.correlation_id,
      }, {
        notificationId: n.notificationId,
        channel: n.channel,
        providerMessageId: res.providerMessageId,
        deliveredAt: new Date().toISOString(),
        status: res.status,
        failureReason: res.failureReason,
      });
    } else {
      const backoffs = [60_000, 300_000, 900_000];
      const nextIdx = Math.min(nextAttempt, backoffs.length) - 1;
      const nextAttemptAt = new Date(Date.now() + backoffs[nextIdx]).toISOString();
      await ledger.append('NotificationRetryScheduled', md, {
        notificationId: n.notificationId,
        nextAttemptAt,
        attemptNumber: nextAttempt,
      });
    }
  }
}