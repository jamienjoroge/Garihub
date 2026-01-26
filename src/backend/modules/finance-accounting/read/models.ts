import { EventLedger, DomainEvent } from '../../../core/event-ledger/Ledger';

export interface InvoiceView {
  id: string;
  jobId: string;
  customerName: string;
  branchId: string;
  currency: string;
  items: { description: string; quantity: number; unitCost: number; total: number }[];
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  dueDate: string;
}

export interface VatLedgerViewItem {
  month: string;
  branchId: string;
  totalVat: number;
}

export interface AccountBalanceViewItem {
  account: string;
  balance: number;
}

export async function projectInvoices(ledger: EventLedger, tenant_id: string): Promise<InvoiceView[]> {
  const evts = await ledger.replay(tenant_id);
  const invoices = new Map<string, InvoiceView>();
  for (const e of evts) {
    if (e.event_name === 'InvoiceGenerated') {
      invoices.set(e.payload.entityId, {
        id: e.payload.entityId,
        jobId: e.payload.jobId,
        customerName: e.payload.customerName,
        branchId: e.payload.branchId,
        currency: e.payload.currency,
        items: e.payload.items,
        netAmount: e.payload.netAmount,
        vatAmount: e.payload.vatAmount,
        totalAmount: e.payload.totalAmount,
        dueDate: e.payload.dueDate,
      });
    } else if (e.event_name === 'VATCalculated') {
      const v = invoices.get(e.payload.entityId);
      if (v) v.vatAmount = e.payload.vatAmount;
    }
  }
  return Array.from(invoices.values());
}

export async function projectVatMonthly(ledger: EventLedger, tenant_id: string): Promise<VatLedgerViewItem[]> {
  const evts = await ledger.replay(tenant_id, { event_name: 'VATCalculated' });
  const map = new Map<string, VatLedgerViewItem>();
  for (const e of evts as DomainEvent[]) {
    const key = `${e.payload.month}:${e.payload.branchId}`;
    const current = map.get(key) || { month: e.payload.month, branchId: e.payload.branchId, totalVat: 0 };
    current.totalVat = Number((current.totalVat + Number(e.payload.vatAmount || 0)).toFixed(2));
    map.set(key, current);
  }
  return Array.from(map.values());
}

export async function projectAccountBalances(ledger: EventLedger, tenant_id: string): Promise<AccountBalanceViewItem[]> {
  const evts = await ledger.replay(tenant_id, { event_name: 'JournalEntryPosted' });
  const map = new Map<string, number>();
  for (const e of evts as DomainEvent[]) {
    for (const line of e.payload.lines as any[]) {
      const prev = map.get(line.account) || 0;
      const next = Number((prev + Number(line.debit || 0) - Number(line.credit || 0)).toFixed(2));
      map.set(line.account, next);
    }
  }
  return Array.from(map.entries()).map(([account, balance]) => ({ account, balance }));
}

export interface PaymentView {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'bank';
  reference?: string;
  receivedAt: string;
  branchId: string;
}

export async function projectPayments(ledger: EventLedger, tenant_id: string): Promise<PaymentView[]> {
  const evts = await ledger.replay(tenant_id, { event_name: 'PaymentRecorded' });
  return (evts as any[]).map(e => ({
    id: e.payload.entityId,
    invoiceId: e.payload.invoiceId,
    amount: Number(e.payload.amount || 0),
    paymentMethod: e.payload.paymentMethod,
    reference: e.payload.reference,
    receivedAt: e.payload.receivedAt,
    branchId: e.payload.branchId,
  }));
}

export interface OutstandingInvoiceView {
  invoiceId: string;
  customerName: string;
  branchId: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export async function projectOutstandingInvoices(ledger: EventLedger, tenant_id: string): Promise<OutstandingInvoiceView[]> {
  const all = await ledger.replay(tenant_id);
  const invoices = all.filter(e => e.event_name === 'InvoiceGenerated');
  const payments = all.filter(e => e.event_name === 'PaymentRecorded');
  const paidByInvoice = new Map<string, number>();
  for (const p of payments as any[]) {
    const v = paidByInvoice.get(p.payload.invoiceId) || 0;
    paidByInvoice.set(p.payload.invoiceId, Number((v + Number(p.payload.amount || 0)).toFixed(2)));
  }
  return (invoices as any[]).map(inv => {
    const total = Number(inv.payload.totalAmount || 0);
    const paid = paidByInvoice.get(inv.payload.entityId) || 0;
    const outstanding = Number((total - paid).toFixed(2));
    return {
      invoiceId: inv.payload.entityId,
      customerName: inv.payload.customerName,
      branchId: inv.payload.branchId,
      totalAmount: total,
      paidAmount: paid,
      outstandingAmount: outstanding,
    };
  });
}

export async function projectCashBalance(ledger: EventLedger, tenant_id: string): Promise<AccountBalanceViewItem[]> {
  const balances = await projectAccountBalances(ledger, tenant_id);
  return balances.filter(b => ['Cash', 'Bank', 'Mpesa'].includes(b.account));
}

export interface GrossProfitItem {
  key: { jobId?: string; month?: string; branchId?: string };
  revenue: number;
  cogs: number;
  grossProfit: number;
}

export async function projectGrossProfit(ledger: EventLedger, tenant_id: string, groupBy: 'job' | 'month' | 'branch' = 'month'): Promise<GrossProfitItem[]> {
  const evts = await ledger.replay(tenant_id);
  const map = new Map<string, GrossProfitItem>();
  function keyFor(e: any): { keyStr: string; keyObj: any } {
    if (groupBy === 'job') {
      const jobId = e.payload.jobId || e.payload.entityId;
      return { keyStr: `job:${jobId}`, keyObj: { jobId } };
    }
    if (groupBy === 'branch') {
      const branchId = e.payload.branchId ?? e.metadata?.branch_id;
      return { keyStr: `branch:${branchId}`, keyObj: { branchId } };
    }
    const month = (e.metadata?.timestamp || new Date().toISOString()).slice(0, 7);
    return { keyStr: `month:${month}`, keyObj: { month } };
  }
  for (const e of evts as any[]) {
    if (e.event_name === 'InvoiceGenerated') {
      const { keyStr, keyObj } = keyFor(e);
      const cur = map.get(keyStr) || { key: keyObj, revenue: 0, cogs: 0, grossProfit: 0 };
      cur.revenue = Number((cur.revenue + Number(e.payload.totalAmount || 0)).toFixed(2));
      cur.grossProfit = Number((cur.revenue - cur.cogs).toFixed(2));
      map.set(keyStr, cur);
    }
    if (e.event_name === 'JournalEntryPosted') {
      const hasCogs = (e.payload.lines as any[]).some(l => l.account === 'Cost of Sales');
      if (hasCogs) {
        const { keyStr, keyObj } = keyFor(e);
        const cogsAmt = (e.payload.lines as any[]).filter(l => l.account === 'Cost of Sales').reduce((s, l) => s + Number(l.debit || 0), 0);
        const cur = map.get(keyStr) || { key: keyObj, revenue: 0, cogs: 0, grossProfit: 0 };
        cur.cogs = Number((cur.cogs + cogsAmt).toFixed(2));
        cur.grossProfit = Number((cur.revenue - cur.cogs).toFixed(2));
        map.set(keyStr, cur);
      }
    }
  }
  return Array.from(map.values());
}