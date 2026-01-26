import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { runNotificationsWorker } from '../worker';
import { projectNotificationOutbox, projectNotificationHistory } from '../../modules/notifications/read/models';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seedRequested(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c1', timestamp: '2026-01-10T00:00:00Z' };
  await ledger.append('NotificationRequested', m, {
    notificationId: 'n1', tenant_id: tenant, userId: 'u', channel: 'email', template: 'INSPECTION_COMPLETED', targetRef: 'veh-1', payload: {}, requestedAt: m.timestamp, correlation_id: m.correlation_id,
  });
  await ledger.append('NotificationRequested', m, {
    notificationId: 'n2', tenant_id: tenant, userId: 'u', channel: 'sms', template: 'SERVICE_RECORD_MINTED', targetRef: 'veh-1', payload: {}, requestedAt: m.timestamp, correlation_id: 'c2',
  });
}

async function run() {
  const baseDir = await setupBaseDir('notifications-worker');
  const ledger = new EventLedger({ baseDir });
  await seedRequested(ledger, 't1');
  let outbox = await projectNotificationOutbox(ledger, 't1');
  if (outbox.length !== 2) throw new Error('Outbox seed mismatch');
  await runNotificationsWorker(ledger, 't1');
  outbox = await projectNotificationOutbox(ledger, 't1');
  if (outbox.length !== 0) throw new Error('Outbox not empty after worker');
  const history = await projectNotificationHistory(ledger, 't1');
  const d1 = history.find(h => h.notificationId === 'n1');
  const d2 = history.find(h => h.notificationId === 'n2');
  if (!d1 || d1.status !== 'DELIVERED') throw new Error('n1 should be DELIVERED');
  if (!d2 || d2.status !== 'FAILED') throw new Error('n2 should be FAILED');
  await runNotificationsWorker(ledger, 't1');
  const history2 = await projectNotificationHistory(ledger, 't1');
  if (history2.length !== history.length) throw new Error('Worker should be idempotent');
  // eslint-disable-next-line no-console
  console.log('Notifications worker tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });