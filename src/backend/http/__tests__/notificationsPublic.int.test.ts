import path from 'path';
import { promises as fs } from 'fs';
import { createServer } from '../../server';
import { createPublicNotificationProofController } from '../controllers/notificationsPublic';
import { createNotificationProofByIdController } from '../controllers/notificationsProof';
import { EventLedger } from '../../core/event-ledger/Ledger';

function makeServer(baseDir: string) {
  const ledger = new EventLedger({ baseDir });
  const jobsStub = { create: async () => {}, start: async () => {}, addPart: async () => {}, recordLabor: async () => {}, complete: async () => {} } as any;
  const invoicesStub = { create: async (_req: any, _res: any) => {} };
  const paymentsStub = { record: async (_req: any, _res: any) => {} };
  const inventoryStub = { issue: async (_req: any, _res: any) => {} };
  const managerStub = { summary: async () => {}, jobsProfitability: async () => {} };
  const vehiclesStub = { history: async () => {}, inspections: async () => {}, recordInspection: async () => {} };
  const publicStub = { history: async () => {}, inspections: async () => {} };
  const shareStub = { create: async () => {} };
  const webhooksStub = { smsReceipt: async () => {} };
  const adminStub = { reconcile: async () => {} };
  const notificationsProof = { byId: createNotificationProofByIdController(ledger), byUser: async () => {} };
  const notificationsPublic = { byId: createPublicNotificationProofController(ledger) };
  return { app: createServer({ jobs: jobsStub, invoices: invoicesStub, payments: paymentsStub, inventory: inventoryStub, manager: managerStub, vehicles: vehiclesStub, public: publicStub, share: shareStub, webhooks: webhooksStub, admin: adminStub, notificationsProof, notificationsPublic }), ledger };
}

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seed(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: new Date().toISOString() };
  await ledger.append('NotificationRequested', m, { notificationId: 'n-pub', tenant_id: tenant, userId: 'u', channel: 'sms', template: 'INSPECTION_COMPLETED', targetRef: 'veh', payload: { phone: '2547...', message: 'ok' }, requestedAt: m.timestamp, correlation_id: m.correlation_id });
  await ledger.append('NotificationDeliveryAttempted', m, { notificationId: 'n-pub', attemptNumber: 1, status: 'DELIVERED', providerMessageId: 'PMID-PUB', attemptedAt: m.timestamp });
  await ledger.append('NotificationDelivered', m, { notificationId: 'n-pub', channel: 'sms', providerMessageId: 'PMID-PUB', deliveredAt: m.timestamp, status: 'DELIVERED' });
  await ledger.append('NotificationProofAccessGranted', m, { notificationId: 'n-pub', tokenId: 'tok-n', expiresAt: '2099-01-01T00:00:00Z', issuedBy: 'u', reason: 'share' });
}

async function run() {
  const baseDir = await setupBaseDir('notifications-public-http');
  const { app, ledger } = makeServer(baseDir);
  await app.ready();
  await seed(ledger, 't1');
  const headers = { 'x-tenant-id': 't1' } as any;
  const internal = await app.inject({ method: 'GET', url: '/api/notifications/n-pub/proof', headers });
  const publicResp = await app.inject({ method: 'GET', url: '/public/notifications/n-pub/proof?token=tok-n', headers });
  if (publicResp.statusCode !== 200) throw new Error(`Expected 200 got ${publicResp.statusCode}`);
  if (publicResp.body !== internal.body) throw new Error('Public proof must equal internal proof');
  const expired = await app.inject({ method: 'GET', url: '/public/notifications/n-pub/proof?token=expired', headers });
  if (expired.statusCode !== 403) throw new Error('Expired token should be 403');
  // No mutation assertion
  const before = (await fs.readFile(path.join(baseDir, 't1.ndjson'), 'utf-8')).split('\n').filter(Boolean).length;
  const again = await app.inject({ method: 'GET', url: '/public/notifications/n-pub/proof?token=tok-n', headers });
  const after = (await fs.readFile(path.join(baseDir, 't1.ndjson'), 'utf-8')).split('\n').filter(Boolean).length;
  if (before !== after) throw new Error('GET must not mutate ledger');
  // eslint-disable-next-line no-console
  console.log('Public notifications proof HTTP tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });