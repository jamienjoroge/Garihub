import path from 'path';
import { createServer } from '../../server';
import { createInvoiceController } from '../controllers/invoices';
import { createPaymentController } from '../controllers/payments';
import { FinanceService } from '../../modules/finance-accounting/write/services';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { promises as fs } from 'fs';
import { AuthService } from '../../modules/auth/write/services';
import { createAuthControllers } from '../controllers/auth';

function makeServer(baseDir: string) {
  const ledger = new EventLedger({ baseDir });
  const finance = new FinanceService(ledger);
  const invoicesCtrl = { create: createInvoiceController(finance) };
  const paymentsCtrl = { record: createPaymentController(finance) };
  const jobsStub = { create: async () => {}, start: async () => {}, addPart: async () => {}, recordLabor: async () => {}, complete: async () => {} } as any;
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
  return { app: createServer({ jobs: jobsStub, invoices: invoicesCtrl, payments: paymentsCtrl, inventory: inventoryStub, manager: managerStub, vehicles: vehiclesStub, public: publicStub, share: shareStub, webhooks: webhooksStub, admin: adminStub, notificationsProof, notificationsPublic, customerVehicles, preferences, notificationsInbox, vehiclePdf, auth: createAuthControllers(auth) }), ledger };
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

async function testSuccess() {
  const baseDir = await setupBaseDir('payments-success');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = { 'x-tenant-id': 't1', 'x-branch-id': 'b1', 'x-user-id': 'u1', 'x-correlation-id': 'c1-pay' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254766666666' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254766666666', code: '123456' } });
  const token = verResp.json().token as string;
  const net = 1000;
  const inv = await app.inject({ method: 'POST', url: '/api/invoices', headers: { ...headers, Authorization: `Bearer ${token}` }, payload: { invoiceId: 'inv-10', jobId: 'job-10', customerName: 'ACME', branchId: 'b1', currency: 'KES', items: [], netAmount: net, dueDate: '2026-02-01' } });
  if (inv.statusCode !== 201) throw new Error(`Invoice create failed ${inv.statusCode}`);
  const pay = await app.inject({ method: 'POST', url: '/api/payments', headers: { ...headers, Authorization: `Bearer ${token}`, 'x-correlation-id': 'c1-pay-1' }, payload: { paymentId: 'pay-1', invoiceId: 'inv-10', amount: 200, paymentMethod: 'cash', reference: 'R1', receivedAt: '2026-02-02', branchId: 'b1' } });
  if (pay.statusCode !== 201) throw new Error(`Payment failed ${pay.statusCode}`);
  const body = pay.json();
  if (body.event_name !== 'PaymentRecorded') throw new Error('Expected PaymentRecorded');
  if (body.payload.amount !== 200) throw new Error('Amount mismatch');
}

async function testOverpaymentError() {
  const baseDir = await setupBaseDir('payments-overpay');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = { 'x-tenant-id': 't1', 'x-branch-id': 'b1', 'x-user-id': 'u1', 'x-correlation-id': 'c1-pay-err' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254777777777' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254777777777', code: '123456' } });
  const token = verResp.json().token as string;
  const net = 300;
  const inv = await app.inject({ method: 'POST', url: '/api/invoices', headers: { ...headers, Authorization: `Bearer ${token}` }, payload: { invoiceId: 'inv-20', jobId: 'job-20', customerName: 'ACME', branchId: 'b1', currency: 'KES', items: [], netAmount: net, dueDate: '2026-02-01' } });
  if (inv.statusCode !== 201) throw new Error(`Invoice create failed ${inv.statusCode}`);
  const pay = await app.inject({ method: 'POST', url: '/api/payments', headers: { ...headers, Authorization: `Bearer ${token}` }, payload: { paymentId: 'pay-err', invoiceId: 'inv-20', amount: 100000, paymentMethod: 'cash', reference: 'R1', receivedAt: '2026-02-02', branchId: 'b1' } });
  if (pay.statusCode !== 422) throw new Error(`Expected 422 got ${pay.statusCode}`);
  const body = pay.json();
  if (body.errorCode !== 'VALIDATION_ERROR') throw new Error('Expected VALIDATION_ERROR');
}

async function testIdempotency() {
  const baseDir = await setupBaseDir('payments-idem');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = { 'x-tenant-id': 't1', 'x-branch-id': 'b1', 'x-user-id': 'u1', 'x-correlation-id': 'c1-pay-idem' } as any;
  const reqResp = await app.inject({ method: 'POST', url: '/api/auth/request-otp', headers, payload: { phone: '254788888888' } });
  const { otpId } = reqResp.json();
  const verResp = await app.inject({ method: 'POST', url: '/api/auth/verify-otp', headers, payload: { otpId, phone: '254788888888', code: '123456' } });
  const token = verResp.json().token as string;
  const net = 500;
  const inv = await app.inject({ method: 'POST', url: '/api/invoices', headers: { ...headers, Authorization: `Bearer ${token}` }, payload: { invoiceId: 'inv-30', jobId: 'job-30', customerName: 'ACME', branchId: 'b1', currency: 'KES', items: [], netAmount: net, dueDate: '2026-02-01' } });
  if (inv.statusCode !== 201) throw new Error(`Invoice create failed ${inv.statusCode}`);
  const payload = { paymentId: 'pay-2', invoiceId: 'inv-30', amount: 250, paymentMethod: 'bank', reference: 'R2', receivedAt: '2026-02-02', branchId: 'b1' };
  const resp1 = await app.inject({ method: 'POST', url: '/api/payments', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp1.statusCode !== 201) throw new Error(`Payment failed ${resp1.statusCode}`);
  const before = await readLedgerLines(baseDir, 't1');
  const resp2 = await app.inject({ method: 'POST', url: '/api/payments', headers: { ...headers, Authorization: `Bearer ${token}` }, payload });
  if (resp2.statusCode !== resp1.statusCode) throw new Error('Idempotency status mismatch');
  if (resp2.body !== resp1.body) throw new Error('Idempotency payload mismatch');
  const after = await readLedgerLines(baseDir, 't1');
  if (after.length !== before.length) throw new Error('Ledger mutated on duplicate request');
}

async function run() {
  await testSuccess();
  await testOverpaymentError();
  await testIdempotency();
  // eslint-disable-next-line no-console
  console.log('Payments HTTP integration tests passed');
}

run().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});