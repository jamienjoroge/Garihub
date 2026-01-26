import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectUserNotificationInbox } from '../read/inbox';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seed(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: new Date().toISOString() };
  await ledger.append('NotificationRequested', m, { notificationId: 'n-inbox', tenant_id: tenant, userId: 'u', channel: 'sms', template: 'INSPECTION_COMPLETED', targetRef: 'veh', payload: {}, requestedAt: m.timestamp, correlation_id: m.correlation_id });
  await ledger.append('NotificationDeliveryAttempted', m, { notificationId: 'n-inbox', attemptNumber: 1, status: 'FAILED', failureReason: 'TRANSIENT_PROVIDER_FAILURE', providerMessageId: 'PMID-I', attemptedAt: m.timestamp });
}

async function run() {
  const baseDir = await setupBaseDir('notifications-inbox');
  const ledger = new EventLedger({ baseDir });
  await seed(ledger, 't1');
  const items = await projectUserNotificationInbox(ledger, 't1', 'u');
  if (!items.length) throw new Error('Inbox empty');
  // eslint-disable-next-line no-console
  console.log('Notifications inbox read tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });