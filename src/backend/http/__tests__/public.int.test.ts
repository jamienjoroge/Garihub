import path from 'path';
import { createServer } from '../../server';
import { createPublicVehicleHistoryController, createPublicVehicleInspectionsController } from '../controllers/public';
import { createShareAccessController } from '../controllers/vehicles';
import { VehicleAccessService } from '../../modules/customer-vehicles/write/accessService';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { promises as fs } from 'fs';

function makeServer(baseDir: string) {
  const ledger = new EventLedger({ baseDir });
  const access = new VehicleAccessService(ledger);
  const publicCtrl = { history: createPublicVehicleHistoryController(ledger), inspections: createPublicVehicleInspectionsController(ledger) };
  const shareCtrl = { create: createShareAccessController(access) };
  const jobsStub = { create: async () => {}, start: async () => {}, addPart: async () => {}, recordLabor: async () => {}, complete: async () => {} } as any;
  const invoicesStub = { create: async (_req: any, _res: any) => {} };
  const paymentsStub = { record: async (_req: any, _res: any) => {} };
  const inventoryStub = { issue: async (_req: any, _res: any) => {} };
  const managerStub = { summary: async () => {}, jobsProfitability: async () => {} };
  const vehiclesStub = { history: async () => {}, inspections: async () => {}, recordInspection: async () => {} };
  return { app: createServer({ jobs: jobsStub, invoices: invoicesStub, payments: paymentsStub, inventory: inventoryStub, manager: managerStub, vehicles: vehiclesStub, public: publicCtrl, share: shareCtrl }), ledger };
}

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seedVehicle(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: '2026-01-10T00:00:00Z' };
  const job = { id: 'job-v1', vehicle: { id: 'veh-1', plateNumber: 'KAA123A', make: 'Toyota', model: 'Fielder', year: 2014, vin: 'VIN123', ownerName: 'John' }, status: 'COMPLETED', entryDate: '2026-01-09', issueDescription: 'Noise', estimatedCost: 0 };
  await ledger.append('JobCardCreated', m, { job, entityType: 'JobCard', entityId: 'job-v1' });
  await ledger.append('ServiceRecordMinted', m, { vehicleId: 'veh-1', jobId: 'job-v1', date: '2026-01-10', summary: 'Oil change', mileage: 120000 });
}

async function testPublicAccess() {
  const baseDir = await setupBaseDir('public-access');
  const { app } = makeServer(baseDir);
  await app.ready();
  const headers = { 'x-tenant-id': 't1', 'x-branch-id': 'b1', 'x-user-id': 'u1', 'x-correlation-id': 'c-share-1' };
  await seedVehicle((app as any).opts?.ledger || new EventLedger({ baseDir }), 't1');
  const shareResp = await app.inject({ method: 'POST', url: '/api/vehicles/veh-1/share', headers, payload: { tokenId: 'tok-veh-1', expiresAt: '2026-12-31T23:59:59Z', reason: 'resale' } });
  if (shareResp.statusCode !== 201) throw new Error(`Share failed ${shareResp.statusCode}`);
  const histResp = await app.inject({ method: 'GET', url: '/public/vehicles/veh-1/history?token=tok-veh-1', headers: { 'x-tenant-id': 't1' } });
  if (histResp.statusCode !== 200) throw new Error(`History failed ${histResp.statusCode}`);
  const body = histResp.json();
  if (body.vehicleId !== 'veh-1') throw new Error('Vehicle mismatch');
}

async function run() {
  await testPublicAccess();
  // eslint-disable-next-line no-console
  console.log('Public vehicle access tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });