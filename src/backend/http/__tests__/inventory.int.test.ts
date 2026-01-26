import path from 'path';
import { createServer } from '../../server';
import { createIssueStockController } from '../controllers/inventory';
import { InventoryService } from '../../modules/inventory/write/services';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { promises as fs } from 'fs';
import { AuthService } from '../../modules/auth/write/services';
import { createAuthControllers } from '../controllers/auth';

function makeServer(baseDir: string) {
  const ledger = new EventLedger({ baseDir });
  const inventory = new InventoryService(ledger);
  const inventoryCtrl = { issue: createIssueStockController(inventory) };
  const jobsStub = { create: async () => {}, start: async () => {}, addPart: async () => {}, recordLabor: async () => {}, complete: async () => {} } as any;
  const invoicesStub = { create: async (_req: any, _res: any) => {} };
  const paymentsStub = { record: async (_req: any, _res: any) => {} };
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
  const auth = new AuthService(ledger);
  return { app: createServer({ jobs: jobsStub, invoices: invoicesStub, payments: paymentsStub, inventory: inventoryCtrl, manager: managerStub, vehicles: vehiclesStub, public: publicStub, share: shareStub, webhooks: webhooksStub, admin: adminStub, notificationsProof, notificationsPublic, customerVehicles, preferences, notificationsInbox, vehiclePdf, auth: createAuthControllers(auth) }), ledger };
}

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seedStockReceived(ledger: EventLedger, tenant: string, branchId: string, productId: string, quantity: number, unitCost: number) {
  const metadata = { tenant_id: tenant, branch_id: branchId, user_id: 'tester', correlation_id: `seed-${productId}`, timestamp: new Date().toISOString() };
  await ledger.append('StockReceived', metadata, { entityType: 'GoodsReceipt', entityId: `gr-${Date.now()}`, branchId, productId, quantity, unitCost });
}

async function testSuccess() {
  const baseDir = await setupBaseDir('inventory-success');
  const { app, ledger } = makeServer(baseDir);
  await app.ready();
  await seedStockReceived(ledger, 't1', 'b1', 'p1', 10, 100);
  const headers = { 'x-tenant-id': 't1', 'x-branch-id': 'b1', 'x-user-id': 'u1', 'x-correlation-id': 'c1-issue' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254700000000' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254700000000', code: '123456' } });
  const token = verResp.json().token as string;
  const payload = { issueId: 'iss-1', jobId: 'job-1', productId: 'p1', quantity: 2, unitCost: 100, branchId: 'b1' };
  const resp = await app.inject({ method: 'POST', url: '/api/inventory/issue', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp.statusCode !== 201) throw new Error(`Expected 201 got ${resp.statusCode}`);
  const body = resp.json();
  if (body.event_name !== 'StockIssued') throw new Error('Expected StockIssued');
  if (body.payload.amount !== 200) throw new Error('Amount mismatch');
}

async function testInsufficientStock() {
  const baseDir = await setupBaseDir('inventory-insufficient');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = { 'x-tenant-id': 't1', 'x-branch-id': 'b1', 'x-user-id': 'u1', 'x-correlation-id': 'c1-issue-err' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254711111111' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254711111111', code: '123456' } });
  const token = verResp.json().token as string;
  const payload = { issueId: 'iss-err', jobId: 'job-1', productId: 'p1', quantity: 999, unitCost: 100, branchId: 'b1' };
  const resp = await app.inject({ method: 'POST', url: '/api/inventory/issue', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp.statusCode !== 422) throw new Error(`Expected 422 got ${resp.statusCode}`);
  const body = resp.json();
  if (body.errorCode !== 'VALIDATION_ERROR') throw new Error('Expected VALIDATION_ERROR');
}

async function testIdempotencyDuplicate() {
  const baseDir = await setupBaseDir('inventory-idem');
  const { app, ledger } = makeServer(baseDir);
  await app.ready();
  await seedStockReceived(ledger, 't1', 'b1', 'p1', 5, 100);
  const headers = { 'x-tenant-id': 't1', 'x-branch-id': 'b1', 'x-user-id': 'u1', 'x-correlation-id': 'c1-issue-idem' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254722222222' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254722222222', code: '123456' } });
  const token = verResp.json().token as string;
  const payload = { issueId: 'iss-2', jobId: 'job-2', productId: 'p1', quantity: 1, unitCost: 100, branchId: 'b1' };
  const resp1 = await app.inject({ method: 'POST', url: '/api/inventory/issue', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp1.statusCode !== 201) throw new Error(`Expected 201 got ${resp1.statusCode}`);
  const resp2 = await app.inject({ method: 'POST', url: '/api/inventory/issue', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp2.statusCode !== resp1.statusCode) throw new Error('Idempotency status mismatch');
  if (resp2.body !== resp1.body) throw new Error('Idempotency payload mismatch');
}

async function run() {
  await testSuccess();
  await testInsufficientStock();
  await testIdempotencyDuplicate();
  // eslint-disable-next-line no-console
  console.log('Inventory HTTP integration tests passed');
}

run().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});