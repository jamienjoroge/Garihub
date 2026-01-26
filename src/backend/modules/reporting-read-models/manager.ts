import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectGrossProfit, projectOutstandingInvoices } from '../finance-accounting/read/models';
import { projectJobCost } from '../inventory/read/models';

export interface ManagerMonthlySummary {
  month: string;
  branchId: string;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  outstandingReceivables: number;
  cashBalance: { cash: number; bank: number; mpesa: number };
}

export async function buildManagerMonthlySummary(ledger: EventLedger, tenant_id: string, month: string): Promise<ManagerMonthlySummary[]> {
  const events = await ledger.replay(tenant_id);
  const branchSet = new Set<string>();
  const revenueByBranch = new Map<string, number>();
  const cogsByBranch = new Map<string, number>();
  for (const e of events as any[]) {
    const evtMonth = String((e.metadata?.timestamp || '').slice(0, 7));
    if (evtMonth !== month) continue;
    if (e.event_name === 'InvoiceGenerated') {
      const b = e.payload.branchId;
      branchSet.add(b);
      const prev = revenueByBranch.get(b) || 0;
      revenueByBranch.set(b, Number((prev + Number(e.payload.totalAmount || 0)).toFixed(2)));
    }
    if (e.event_name === 'JournalEntryPosted') {
      const b = e.metadata?.branch_id;
      const cogsAmt = (e.payload.lines as any[]).filter((l: any) => l.account === 'Cost of Sales').reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
      if (cogsAmt > 0) {
        branchSet.add(b);
        const prev = cogsByBranch.get(b) || 0;
        cogsByBranch.set(b, Number((prev + cogsAmt).toFixed(2)));
      }
    }
  }
  const outstanding = await projectOutstandingInvoices(ledger, tenant_id);
  const results: ManagerMonthlySummary[] = [];
  for (const branchId of branchSet) {
    const revenue = revenueByBranch.get(branchId) || 0;
    const cogs = cogsByBranch.get(branchId) || 0;
    const gp = Number((revenue - cogs).toFixed(2));
    const ar = outstanding.filter(o => o.branchId === branchId).reduce((s, o) => s + Number(o.outstandingAmount || 0), 0);
    const cash = { cash: 0, bank: 0, mpesa: 0 };
    results.push({ month, branchId, totalRevenue: revenue, totalCOGS: cogs, grossProfit: gp, outstandingReceivables: Number(ar.toFixed(2)), cashBalance: cash });
  }
  return results;
}

export interface JobProfitabilityView {
  jobId: string;
  customerName?: string;
  vehicleId?: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercent: number;
}

export async function buildJobProfitability(ledger: EventLedger, tenant_id: string): Promise<JobProfitabilityView[]> {
  const invoices = await projectInvoices(ledger, tenant_id);
  const results: JobProfitabilityView[] = [];
  for (const inv of invoices) {
    const jobId = inv.jobId;
    const revenue = Number(inv.totalAmount || 0);
    const cost = await projectJobCost(ledger, tenant_id, jobId);
    const gp = Number((revenue - cost).toFixed(2));
    const margin = revenue > 0 ? Number(((gp / revenue) * 100).toFixed(2)) : 0;
    let vehicleId: string | undefined;
    let customerName = inv.customerName;
    const evts = await ledger.replay(tenant_id);
    const jc = evts.find(e => e.event_name === 'JobCardCreated' && e.payload.job?.id === jobId);
    if (jc) vehicleId = jc.payload.job?.vehicle?.id;
    results.push({ jobId, customerName, vehicleId, revenue, cost, grossProfit: gp, marginPercent: margin });
  }
  return results;
}