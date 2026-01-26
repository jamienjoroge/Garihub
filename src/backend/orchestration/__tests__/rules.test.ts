import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { CustomerVehicleService } from '../../modules/customer-vehicles/write/services';
import { NotificationService } from '../../modules/notifications/write/services';
import { OrchestrationRules } from '../rules';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seedJob(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c-o', timestamp: new Date().toISOString() };
  const job = { id: 'job-orch', vehicle: { id: 'veh-orch', plateNumber: 'KAA', make: 'Toyota', model: 'Fielder', year: 2014, vin: 'VIN' }, status: 'COMPLETED', entryDate: m.timestamp, issueDescription: 'Noise', estimatedCost: 0 };
  await ledger.append('JobCardCreated', m, { job, entityType: 'JobCard', entityId: 'job-orch' });
  await ledger.append('JobCompleted', m, { entityType: 'JobCard', entityId: 'job-orch', notes: 'Done' });
}

async function run() {
  const baseDir = await setupBaseDir('orchestration-tests');
  const ledger = new EventLedger({ baseDir });
  await seedJob(ledger, 't1');
  const vehicleSvc = new CustomerVehicleService(ledger);
  const notifSvc = new NotificationService(ledger);
  const orch = new OrchestrationRules(ledger, vehicleSvc, notifSvc);
  await orch.run('t1');
  const data = await fs.readFile(path.join(baseDir, 't1.ndjson'), 'utf-8');
  const lines = data.trim().split('\n');
  const minted = lines.some(l => l.includes('ServiceRecordMinted'));
  if (!minted) throw new Error('ServiceRecordMinted missing');
  const requested = lines.some(l => l.includes('NotificationRequested'));
  if (!requested) throw new Error('NotificationRequested missing');
  const beforeCount = lines.length;
  await orch.run('t1');
  const data2 = await fs.readFile(path.join(baseDir, 't1.ndjson'), 'utf-8');
  const lines2 = data2.trim().split('\n');
  if (lines2.length !== beforeCount) throw new Error('Orchestration should be idempotent');
  // eslint-disable-next-line no-console
  console.log('Orchestration rules tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });