import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { SmsProvider } from '../providers/SmsProvider';
import { runNotificationsWorker } from '../worker';
import { projectNotificationHistory, projectNotificationOutbox } from '../../modules/notifications/read/models';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seedRequested(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c-prov', timestamp: '2026-01-10T00:00:00Z' };
  await ledger.append('NotificationRequested', m, {
    notificationId: 'n-sms', tenant_id: tenant, userId: 'u', channel: 'sms', template: 'INSPECTION_COMPLETED', targetRef: 'veh-1', payload: {}, requestedAt: m.timestamp, correlation_id: m.correlation_id,
  });
}

async function run() {
  const baseDir = await setupBaseDir('provider-tests');
  const ledger = new EventLedger({ baseDir });
  await seedRequested(ledger, 't1');
  const provider = new SmsProvider();
  await runNotificationsWorker(ledger, 't1', provider);
  const history = await projectNotificationHistory(ledger, 't1');
  const item = history.find(h => h.notificationId === 'n-sms');
  if (!item) throw new Error('No delivery event');
  const outbox = await projectNotificationOutbox(ledger, 't1');
  if (outbox.length !== 0) throw new Error('Outbox should be empty');
  // eslint-disable-next-line no-console
  console.log('Provider tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });