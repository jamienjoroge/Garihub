import { EventLedger } from '../../core/event-ledger/Ledger';
import path from 'path';
import { promises as fs } from 'fs';
import { projectVehicleHistory, projectInspectionSummary } from '../read/models';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seed(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: '2026-01-10T00:00:00Z' };
  const job = { id: 'job-v1', vehicle: { id: 'veh-1', plateNumber: 'KAA123A', make: 'Toyota', model: 'Fielder', year: 2014, vin: 'VIN123', ownerName: 'John' }, status: 'COMPLETED', entryDate: '2026-01-09', issueDescription: 'Noise', estimatedCost: 0 };
  await ledger.append('JobCardCreated', m, { job, entityType: 'JobCard', entityId: 'job-v1' });
  await ledger.append('ServiceRecordMinted', m, { vehicleId: 'veh-1', jobId: 'job-v1', date: '2026-01-10', summary: 'Oil change', mileage: 120000 });
  await ledger.append('InspectionRecorded', m, { inspectionId: 'insp-1', vehicleId: 'veh-1', inspectorId: 'E1', inspectionType: 'routine', findings: ['OK'], passed: true, notes: 'All good', date: '2026-01-11' });
  await ledger.append('InvoiceGenerated', m, { entityType: 'Invoice', entityId: 'inv-v1', jobId: 'job-v1', customerName: 'John', branchId: 'b1', currency: 'KES', items: [], netAmount: 1000, vatAmount: 160, totalAmount: 1160, dueDate: '2026-01-30' });
}

async function run() {
  const baseDir = await setupBaseDir('vehicle-read');
  const ledger = new EventLedger({ baseDir });
  await seed(ledger, 't1');
  const history = await projectVehicleHistory(ledger, 't1', 'veh-1');
  if (history.timeline.length < 4) throw new Error('Timeline incomplete');
  const inspections = await projectInspectionSummary(ledger, 't1', 'veh-1');
  if (inspections.inspectionCount !== 1) throw new Error('Inspection count mismatch');
  // eslint-disable-next-line no-console
  console.log('Customer vehicle read tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });