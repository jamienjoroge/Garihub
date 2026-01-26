import path from 'path';
import { promises as fs } from 'fs';
import { createServer } from '../../server';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { createAuthControllers } from '../controllers/auth';
import { AuthService } from '../../modules/auth/write/services';

function makeServer(baseDir: string) {
  const ledger = new EventLedger({ baseDir });
  const auth = new AuthService(ledger);
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
  const notificationsProof = { byId: async () => {}, byUser: async () => {} };
  const notificationsPublic = { byId: async () => {} };
  const customerVehicles = { list: async () => {} };
  const preferences = { notifications: async () => {} };
  const notificationsInbox = { list: async () => {} };
  const vehiclePdf = { history: async () => {} };
  return { app: createServer({ jobs: jobsStub, invoices: invoicesStub, payments: paymentsStub, inventory: inventoryStub, manager: managerStub, vehicles: vehiclesStub, public: publicStub, share: shareStub, webhooks: webhooksStub, admin: adminStub, notificationsProof, notificationsPublic, customerVehicles, preferences, notificationsInbox, vehiclePdf, auth: createAuthControllers(auth) }), ledger };
}

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function run() {
  const baseDir = await setupBaseDir('auth-http');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = { 'x-tenant-id': 't1' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254700000000' } });
  if (reqResp.statusCode !== 200) throw new Error('request-otp failed');
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254700000000', code: '123456' } });
  if (verResp.statusCode !== 200) throw new Error('verify-otp failed');
  const { token } = verResp.json();
  if (!token) throw new Error('token missing');
  // eslint-disable-next-line no-console
  console.log('Auth OTP HTTP tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });