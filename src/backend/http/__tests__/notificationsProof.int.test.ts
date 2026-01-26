import path from 'path';
import { promises as fs } from 'fs';
import { createServer } from '../../server';
import { createNotificationProofByIdController, createUserNotificationProofController } from '../controllers/notificationsProof';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { AuthService } from '../../modules/auth/write/services';
import { createAuthControllers } from '../controllers/auth';

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
  const notificationsProof = { byId: createNotificationProofByIdController(ledger), byUser: createUserNotificationProofController(ledger) };
  const notificationsPublic = { byId: async () => {} };
  const customerVehicles = { list: async () => {} };
  const preferences = { notifications: async () => {} };
  const notificationsInbox = { list: async () => {} };
  const vehiclePdf = { history: async () => {} };
  const auth = new AuthService(ledger);
  return { app: createServer({ jobs: jobsStub, invoices: invoicesStub, payments: paymentsStub, inventory: inventoryStub, manager: managerStub, vehicles: vehiclesStub, public: publicStub, share: shareStub, webhooks: webhooksStub, admin: adminStub, notificationsProof, notificationsPublic, customerVehicles, preferences, notificationsInbox, vehiclePdf, auth: createAuthControllers(auth) }), ledger };
}

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seed(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: new Date().toISOString() };
  await ledger.append('NotificationRequested', m, { notificationId: 'n-http', tenant_id: tenant, userId: 'u', channel: 'sms', template: 'INSPECTION_COMPLETED', targetRef: 'veh', payload: { phone: '2547...', message: 'ok' }, requestedAt: m.timestamp, correlation_id: m.correlation_id });
  await ledger.append('NotificationDeliveryAttempted', m, { notificationId: 'n-http', attemptNumber: 1, status: 'DELIVERED', providerMessageId: 'PMID-H', attemptedAt: m.timestamp });
  await ledger.append('NotificationCostRecorded', m, { notificationId: 'n-http', attemptNumber: 1, tenant_id: tenant, channel: 'sms', unitCost: 1, currency: 'KES', totalCost: 1, recordedAt: m.timestamp });
  await ledger.append('NotificationDelivered', m, { notificationId: 'n-http', channel: 'sms', providerMessageId: 'PMID-H', deliveredAt: m.timestamp, status: 'DELIVERED' });
}

async function run() {
  const baseDir = await setupBaseDir('notifications-proof-http');
  const { app, ledger } = makeServer(baseDir);
  await app.ready();
  await seed(ledger, 't1');
  const headers = { 'x-tenant-id': 't1' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254703000000' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254703000000', code: '123456' } });
  const token = verResp.json().token as string;
  const resp1 = await app.inject({ method: 'GET', url: '/api/notifications/n-http/proof', headers: { ...headers, Authorization: `Bearer ${token}` } });
  if (resp1.statusCode !== 200) throw new Error(`Expected 200 got ${resp1.statusCode}`);
  const period = new Date().toISOString().slice(0, 7);
  const resp2 = await app.inject({ method: 'GET', url: `/api/notifications/proof/user/u?period=${period}`, headers: { ...headers, Authorization: `Bearer ${token}` } });
  if (resp2.statusCode !== 200) throw new Error(`Expected 200 got ${resp2.statusCode}`);
  // eslint-disable-next-line no-console
  console.log('Notifications proof HTTP tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });