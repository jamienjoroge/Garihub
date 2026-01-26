import path from 'path';
import { createServer } from '../../server';
import { createRecordInspectionController } from '../controllers/vehicles';
import { CustomerVehicleService } from '../../modules/customer-vehicles/write/services';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { promises as fs } from 'fs';
import { AuthService } from '../../modules/auth/write/services';
import { createAuthControllers } from '../controllers/auth';

function makeServer(baseDir: string) {
  const ledger = new EventLedger({ baseDir });
  const service = new CustomerVehicleService(ledger);
  const vehiclesCtrl = { recordInspection: createRecordInspectionController(service), history: async () => {}, inspections: async () => {} } as any;
  const jobsStub = { create: async () => {}, start: async () => {}, addPart: async () => {}, recordLabor: async () => {}, complete: async () => {} } as any;
  const invoicesStub = { create: async (_req: any, _res: any) => {} };
  const paymentsStub = { record: async (_req: any, _res: any) => {} };
  const inventoryStub = { issue: async (_req: any, _res: any) => {} };
  const managerStub = { summary: async () => {}, jobsProfitability: async () => {} };
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
  const auth = new AuthService(ledger);
  return { app: createServer({ jobs: jobsStub, invoices: invoicesStub, payments: paymentsStub, inventory: inventoryStub, manager: managerStub, vehicles: vehiclesCtrl, public: publicStub, share: shareStub, webhooks: webhooksStub, admin: adminStub, notificationsProof, notificationsPublic, customerVehicles, preferences, notificationsInbox, vehiclePdf, auth: createAuthControllers(auth) }), ledger };
}

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function testInspectionRecordingIdempotent() {
  const baseDir = await setupBaseDir('vehicle-inspect');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = { 'x-tenant-id': 't1', 'x-branch-id': 'b1', 'x-user-id': 'u1', 'x-correlation-id': 'c-inspect-1' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254799999999' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254799999999', code: '123456' } });
  const token = verResp.json().token as string;
  const payload = { inspectionId: 'insp-100', inspectorId: 'E1', inspectionType: 'pre_purchase', findings: ['Brake pads worn'], passed: false, notes: 'Replace pads', date: '2026-01-12' };
  const resp1 = await app.inject({ method: 'POST', url: '/api/vehicles/veh-100/inspections', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp1.statusCode !== 201) throw new Error(`Expected 201 got ${resp1.statusCode}`);
  const resp2 = await app.inject({ method: 'POST', url: '/api/vehicles/veh-100/inspections', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp2.statusCode !== resp1.statusCode) throw new Error('Idempotency status mismatch');
  if (resp2.body !== resp1.body) throw new Error('Idempotency payload mismatch');
}

async function run() {
  await testInspectionRecordingIdempotent();
  // eslint-disable-next-line no-console
  console.log('Vehicle inspections HTTP tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });