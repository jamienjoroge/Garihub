import path from 'path';
import { promises as fs } from 'fs';
import { EventLedger } from '../Ledger';
import { query } from '../../../db/pg';

async function setupMigration() {
  const file = path.resolve(process.cwd(), 'src', 'backend', 'db', 'migrations', '001_event_ledger.sql');
  const sql = await fs.readFile(file, 'utf-8');
  await query(sql);
}

async function run() {
  if (String(process.env.LEDGER_BACKEND || '') !== 'postgres') {
    console.log('SKIP: LEDGER_BACKEND!=postgres');
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.log('SKIP: DATABASE_URL not set');
    return;
  }
  await setupMigration();
  const ledger = new EventLedger({});
  const m = { tenant_id: 'tpg', branch_id: 'b1', user_id: 'tester', correlation_id: 'cpg-1', timestamp: new Date().toISOString() };
  await ledger.append('JobCardCreated', m, { entityType: 'JobCard', entityId: 'job-pg-1', job: { id: 'job-pg-1' } } as any);
  await ledger.append('ServiceRecordMinted', m, { entityType: 'JobCard', entityId: 'job-pg-1', vehicleId: 'veh-pg', previousHash: '', summary: 'Oil' } as any);
  const evts = await ledger.replay('tpg');
  if (evts.length < 2) throw new Error('Expected at least 2 events');
  if (evts[0].event_name !== 'JobCardCreated') throw new Error('Order mismatch');
  if (evts[1].event_name !== 'ServiceRecordMinted') throw new Error('Order mismatch 2');
  console.log('Postgres Ledger integration test passed');
}

run().catch(err => { console.error(err); process.exit(1); });