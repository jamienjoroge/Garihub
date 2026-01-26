import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectCustomerVehiclesList } from '../read/list';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seed(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: new Date().toISOString() };
  const job = { id: 'job-list', vehicle: { id: 'veh-list', plateNumber: 'KAA', make: 'Toyota', model: 'Fielder', year: 2014, vin: 'VIN', ownerName: 'John' }, status: 'COMPLETED', entryDate: m.timestamp, issueDescription: 'Noise', estimatedCost: 0 };
  await ledger.append('JobCardCreated', m, { job, entityType: 'JobCard', entityId: 'job-list' });
  await ledger.append('ServiceRecordMinted', m, { vehicleId: 'veh-list', jobId: 'job-list', date: m.timestamp, summary: 'Oil', mileage: 100000 });
  await ledger.append('InspectionRecorded', m, { inspectionId: 'insp', vehicleId: 'veh-list', inspectorId: 'E1', inspectionType: 'routine', findings: ['OK'], passed: true, notes: '', date: m.timestamp });
}

async function run() {
  const baseDir = await setupBaseDir('customer-vehicles-list');
  const ledger = new EventLedger({ baseDir });
  await seed(ledger, 't1');
  const list = await projectCustomerVehiclesList(ledger, 't1', 'John');
  if (!list.length || list[0].lastServiceDate == null) throw new Error('List projection mismatch');
  // eslint-disable-next-line no-console
  console.log('Customer vehicles list projection tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });