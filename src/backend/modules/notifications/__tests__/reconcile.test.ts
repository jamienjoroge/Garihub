import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { ReconcileService } from '../write/reconcileService';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seedDelivered(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c-recon', timestamp: new Date().toISOString() };
  await ledger.append('NotificationRequested', m, { notificationId: 'n-recon', tenant_id: tenant, userId: 'u', channel: 'sms', template: 'INSPECTION_COMPLETED', targetRef: 'veh', payload: { phone: '2547...', message: 'ok' }, requestedAt: m.timestamp, correlation_id: m.correlation_id });
  await ledger.append('NotificationDeliveryAttempted', m, { notificationId: 'n-recon', attemptNumber: 1, status: 'DELIVERED', providerMessageId: 'PMID-RECON', attemptedAt: m.timestamp });
  await ledger.append('NotificationDelivered', m, { notificationId: 'n-recon', channel: 'sms', providerMessageId: 'PMID-RECON', deliveredAt: m.timestamp, status: 'DELIVERED' });
}

async function run() {
  const baseDir = await setupBaseDir('notifications-reconcile');
  const ledger = new EventLedger({ baseDir });
  await seedDelivered(ledger, 't1');
  await ledger.append('DeliveryReceiptReceived', { tenant_id: 't1', branch_id: 'b1', user_id: 'webhook', correlation_id: 'c-r', timestamp: new Date().toISOString() }, { notificationId: 'n-recon', providerMessageId: 'PMID-RECON', status: 'FAILED', receivedAt: new Date().toISOString(), rawPayloadHash: 'hash', channel: 'sms' });
  const svc = new ReconcileService();
  await svc.run(ledger, 't1', new Date().toISOString());
  const data = await fs.readFile(path.join(baseDir, 't1.ndjson'), 'utf-8');
  const lines = data.trim().split('\n');
  const hasReconciled = lines.some(l => l.includes('NotificationDeliveryReconciled'));
  if (!hasReconciled) throw new Error('Missing NotificationDeliveryReconciled');
  // Unknown providerMessageId case
  await ledger.append('DeliveryReceiptReceived', { tenant_id: 't1', branch_id: 'b1', user_id: 'webhook', correlation_id: 'c-r2', timestamp: new Date().toISOString() }, { providerMessageId: 'PMID-UNKNOWN', status: 'FAILED', receivedAt: new Date().toISOString(), rawPayloadHash: 'hash', channel: 'sms' });
  await svc.run(ledger, 't1', new Date().toISOString());
  // eslint-disable-next-line no-console
  console.log('Reconciliation tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });