import path from 'path';
import { createServer } from '../../server';
import { createInvoiceController } from '../controllers/invoices';
import { FinanceService } from '../../modules/finance-accounting/write/services';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { promises as fs } from 'fs';
import { AuthService } from '../../modules/auth/write/services';
import { createAuthControllers } from '../controllers/auth';

function makeServer(baseDir: string) {
  const ledger = new EventLedger({ baseDir });
  const finance = new FinanceService(ledger);
  const invoicesCtrl = { create: createInvoiceController(finance) };
  const jobsStub = { create: async () => {}, start: async () => {}, addPart: async () => {}, recordLabor: async () => {}, complete: async () => {} } as any;
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
  const auth = new AuthService(ledger);
  return { app: createServer({ jobs: jobsStub, invoices: invoicesCtrl, payments: paymentsStub, inventory: inventoryStub, manager: managerStub, vehicles: vehiclesStub, public: publicStub, share: shareStub, webhooks: webhooksStub, admin: adminStub, notificationsProof, notificationsPublic, customerVehicles, preferences, notificationsInbox, vehiclePdf, auth: createAuthControllers(auth) }), ledger };
}

async function readLedgerLines(baseDir: string, tenant: string) {
  const file = path.join(baseDir, `${tenant}.ndjson`);
  try {
    const data = await fs.readFile(file, 'utf-8');
    return data.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function testSuccessfulInvoiceGeneration() {
  const baseDir = await setupBaseDir('case-success');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = {
    'x-tenant-id': 't1',
    'x-branch-id': 'b1',
    'x-user-id': 'u1',
    'x-correlation-id': 'c1-success',
  } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254733333333' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254733333333', code: '123456' } });
  const token = verResp.json().token as string;
  const net = 1000;
  const resp = await app.inject({
    method: 'POST',
    url: '/api/invoices',
    headers: { ...headers, Authorization: `Bearer ${token}` },
    payload: {
      invoiceId: 'inv-1',
      jobId: 'job-1',
      customerName: 'John Doe',
      branchId: 'b1',
      currency: 'KES',
      items: [],
      netAmount: net,
      dueDate: '2026-02-01',
    },
  });
  if (resp.statusCode !== 201) throw new Error(`Expected 201 got ${resp.statusCode}`);
  const body = resp.json();
  if (body.event_name !== 'InvoiceGenerated') throw new Error('Expected InvoiceGenerated event');
  const vat = Number((Math.round(net * 0.16 * 100) / 100).toFixed(2));
  const total = Number((net + vat).toFixed(2));
  if (body.payload.vatAmount !== vat) throw new Error('VAT mismatch');
  if (body.payload.totalAmount !== total) throw new Error('Total mismatch');
}

async function testErrorMappingInvalidNetAmount() {
  const baseDir = await setupBaseDir('case-invalid-net');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = {
    'x-tenant-id': 't1',
    'x-branch-id': 'b1',
    'x-user-id': 'u1',
    'x-correlation-id': 'c1-error',
  } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254744444444' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254744444444', code: '123456' } });
  const token = verResp.json().token as string;
  const resp = await app.inject({
    method: 'POST',
    url: '/api/invoices',
    headers: { ...headers, Authorization: `Bearer ${token}` },
    payload: {
      invoiceId: 'inv-2',
      jobId: 'job-2',
      customerName: 'Jane Doe',
      branchId: 'b1',
      currency: 'KES',
      items: [],
      netAmount: 0,
      dueDate: '2026-02-01',
    },
  });
  if (resp.statusCode !== 422) throw new Error(`Expected 422 got ${resp.statusCode}`);
  const body = resp.json();
  if (body.errorCode !== 'VALIDATION_ERROR') throw new Error('Expected VALIDATION_ERROR');
  if (!body.correlation_id) throw new Error('Missing correlation_id');
}

async function testIdempotencyDuplicateRequest() {
  const baseDir = await setupBaseDir('case-idem');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = {
    'x-tenant-id': 't1',
    'x-branch-id': 'b1',
    'x-user-id': 'u1',
    'x-correlation-id': 'c1-idem',
  } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254755555555' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254755555555', code: '123456' } });
  const token = verResp.json().token as string;
  const payload = {
    invoiceId: 'inv-3',
    jobId: 'job-3',
    customerName: 'Idem Test',
    branchId: 'b1',
    currency: 'KES',
    items: [],
    netAmount: 500,
    dueDate: '2026-02-01',
  };
  const resp1 = await app.inject({ method: 'POST', url: '/api/invoices', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp1.statusCode !== 201) throw new Error(`Expected 201 got ${resp1.statusCode}`);
  const beforeLines = await readLedgerLines(baseDir, 't1');
  const resp2 = await app.inject({ method: 'POST', url: '/api/invoices', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp2.statusCode !== resp1.statusCode) throw new Error('Idempotency status mismatch');
  if (resp2.body !== resp1.body) throw new Error('Idempotency payload mismatch');
  const afterLines = await readLedgerLines(baseDir, 't1');
  if (afterLines.length !== beforeLines.length) throw new Error('Ledger mutated on duplicate request');
}

async function run() {
  await testSuccessfulInvoiceGeneration();
  await testErrorMappingInvalidNetAmount();
  await testIdempotencyDuplicateRequest();
  // eslint-disable-next-line no-console
  console.log('Finance HTTP integration tests passed');
}

run().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});