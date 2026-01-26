import path from 'path';
import { promises as fs } from 'fs';
import { createServer } from '../../server';
import { createSmsReceiptWebhookController } from '../controllers/webhooks';
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
  const webhooks = { smsReceipt: createSmsReceiptWebhookController(ledger) };
  return { app: createServer({ jobs: jobsStub, invoices: invoicesStub, payments: paymentsStub, inventory: inventoryStub, manager: managerStub, vehicles: vehiclesStub, public: publicStub, share: shareStub, webhooks }), ledger };
}

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function run() {
  process.env.WEBHOOK_SECRET = 'secret';
  const baseDir = await setupBaseDir('webhook-tests');
  const { app, ledger } = makeServer(baseDir);
  await app.ready();
  // Seed a delivery attempt to allow linking by providerMessageId
  const m = { tenant_id: 't1', branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: new Date().toISOString() };
  await ledger.append('NotificationDeliveryAttempted', m, { notificationId: 'nid1', attemptNumber: 1, status: 'FAILED', providerMessageId: 'PMID1', attemptedAt: m.timestamp });
  const headers = { 'x-tenant-id': 't1', 'x-webhook-secret': 'secret' } as any;
  const resp = await app.inject({ method: 'POST', url: '/webhooks/sms/delivery-receipt', headers, payload: { providerMessageId: 'PMID1', status: 'DELIVERED' } });
  if (resp.statusCode !== 200) throw new Error(`Expected 200 got ${resp.statusCode}`);
  const resp2 = await app.inject({ method: 'POST', url: '/webhooks/sms/delivery-receipt', headers: { 'x-tenant-id': 't1', 'x-webhook-secret': 'wrong' }, payload: { providerMessageId: 'X', status: 'FAILED' } });
  if (resp2.statusCode !== 403) throw new Error(`Expected 403 got ${resp2.statusCode}`);
  // Unknown PMID still records
  const resp3 = await app.inject({ method: 'POST', url: '/webhooks/sms/delivery-receipt', headers, payload: { providerMessageId: 'UNKNOWN', status: 'FAILED' } });
  if (resp3.statusCode !== 200) throw new Error('Unknown PMID should still be accepted');
  // eslint-disable-next-line no-console
  console.log('Webhook tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });