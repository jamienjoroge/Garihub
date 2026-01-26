import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { runNotificationsWorker } from '../worker';
import { projectNotificationSpend, projectBudgetStatus } from '../../modules/notifications/read/models';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seedRequested(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c-cost', timestamp: new Date().toISOString() };
  await ledger.append('NotificationRequested', m, {
    notificationId: 'n-cost', tenant_id: tenant, userId: 'u', channel: 'sms', template: 'INSPECTION_COMPLETED', targetRef: 'veh-1', payload: {}, requestedAt: m.timestamp, correlation_id: m.correlation_id,
  });
}

async function run() {
  process.env.SMS_UNIT_COST_KES = '1';
  const baseDir = await setupBaseDir('notifications-costs');
  const ledger = new EventLedger({ baseDir });
  await seedRequested(ledger, 't1');
  await runNotificationsWorker(ledger, 't1');
  const period = new Date().toISOString().slice(0, 7);
  const spend = await projectNotificationSpend(ledger, 't1', period);
  const sms = spend.find(s => s.channel === 'sms');
  if (!sms || sms.totalCost !== 1) throw new Error('SMS cost mismatch');
  const budget = await projectBudgetStatus(ledger, 't1', period);
  if (budget.spent !== 1) throw new Error('Budget spent mismatch');
  process.env.NOTIF_BUDGET_LIMIT_KES = '0';
  await runNotificationsWorker(ledger, 't1');
  const budget2 = await projectBudgetStatus(ledger, 't1', period);
  if (budget2.spent !== 1) throw new Error('Budget should not double-count');
  // eslint-disable-next-line no-console
  console.log('Cost tracking tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });