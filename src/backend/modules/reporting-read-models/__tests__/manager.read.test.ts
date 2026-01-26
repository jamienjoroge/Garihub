import { EventLedger } from '../../core/event-ledger/Ledger';
import path from 'path';
import { promises as fs } from 'fs';
import { buildManagerMonthlySummary, buildJobProfitability } from '../manager';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function seedFinance(ledger: EventLedger, tenant: string) {
  const m = { tenant_id: tenant, branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: '2026-01-10T00:00:00Z' };
  await ledger.append('InvoiceGenerated', m, { entityType: 'Invoice', entityId: 'inv-a', jobId: 'job-a', customerName: 'ACME', branchId: 'b1', currency: 'KES', items: [], netAmount: 1000, vatAmount: 160, totalAmount: 1160, dueDate: '2026-01-30' });
  await ledger.append('JournalEntryPosted', m, { entityType: 'JobCard', entityId: 'job-a', description: 'COGS', lines: [{ account: 'Cost of Sales', debit: 300, credit: 0 }, { account: 'Inventory Asset', debit: 0, credit: 300 }] });
}

async function run() {
  const baseDir = await setupBaseDir('manager-read');
  const ledger = new EventLedger({ baseDir });
  await seedFinance(ledger, 't1');
  const summary = await buildManagerMonthlySummary(ledger, 't1', '2026-01');
  if (!summary.length) throw new Error('No summary rows');
  const row = summary[0];
  if (row.totalRevenue !== 1160) throw new Error('Revenue mismatch');
  if (row.totalCOGS !== 300) throw new Error('COGS mismatch');
  const jobs = await buildJobProfitability(ledger, 't1');
  if (!jobs.length) throw new Error('No job rows');
  const j = jobs[0];
  if (j.grossProfit !== 860) throw new Error('GP mismatch');
  // eslint-disable-next-line no-console
  console.log('Manager read models tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });