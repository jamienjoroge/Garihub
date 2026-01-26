import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectNotificationProof, projectUserNotificationProof } from '../read/proof';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seed(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: new Date().toISOString() };
  await ledger.append('NotificationRequested', m, { notificationId: 'n-proof', tenant_id: tenant, userId: 'u', channel: 'sms', template: 'INSPECTION_COMPLETED', targetRef: 'veh', payload: { phone: '2547...', message: 'ok' }, requestedAt: m.timestamp, correlation_id: m.correlation_id });
  await ledger.append('NotificationDeliveryAttempted', m, { notificationId: 'n-proof', attemptNumber: 1, status: 'DELIVERED', providerMessageId: 'PMID-P', attemptedAt: m.timestamp });
  await ledger.append('NotificationCostRecorded', m, { notificationId: 'n-proof', attemptNumber: 1, tenant_id: tenant, channel: 'sms', unitCost: 1, currency: 'KES', totalCost: 1, recordedAt: m.timestamp });
  await ledger.append('DeliveryReceiptReceived', m, { notificationId: 'n-proof', providerMessageId: 'PMID-P', status: 'DELIVERED', receivedAt: m.timestamp, rawPayloadHash: 'hash', channel: 'sms' });
  await ledger.append('NotificationDeliveryReconciled', m, { notificationId: 'n-proof', providerMessageId: 'PMID-P', attemptNumber: 1, priorStatus: 'DELIVERED', receiptStatus: 'DELIVERED', reconciledAt: m.timestamp, action: 'NO_ACTION', reason: 'MATCHED' });
  await ledger.append('NotificationDelivered', m, { notificationId: 'n-proof', channel: 'sms', providerMessageId: 'PMID-P', deliveredAt: m.timestamp, status: 'DELIVERED' });
}

async function run() {
  const baseDir = await setupBaseDir('notifications-proof-read');
  const ledger = new EventLedger({ baseDir });
  await seed(ledger, 't1');
  const proof = await projectNotificationProof(ledger, 't1', 'n-proof');
  if (!proof.finalOutcome || proof.attempts.length !== 1 || proof.receipts.length !== 1) throw new Error('Proof projection mismatch');
  const period = new Date().toISOString().slice(0, 7);
  const userProof = await projectUserNotificationProof(ledger, 't1', 'u', period);
  if (userProof.summary.delivered !== 1 || userProof.summary.total_spend !== 1) throw new Error('User proof mismatch');
  // eslint-disable-next-line no-console
  console.log('Proof read tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });