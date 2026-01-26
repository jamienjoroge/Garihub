import { EventLedger } from '../../../core/event-ledger/Ledger';
import { GenerateInvoiceCommand } from './commands';
import { ValidationError, InvalidStateTransitionError } from '../../../core/errors/domain';
import { RecordPaymentCommand } from './commands';

export class FinanceService {
  constructor(private ledger: EventLedger) {}

  async generateInvoice(cmd: GenerateInvoiceCommand) {
    const net = Number(cmd.payload.netAmount || 0);
    if (!isFinite(net) || net <= 0) throw new ValidationError('Invalid net amount');
    const rate = 0.16;
    const vat = Number((Math.round(net * rate * 100) / 100).toFixed(2));
    const total = Number((net + vat).toFixed(2));
    const invoiceEvt = await this.ledger.append('InvoiceGenerated', cmd.metadata, {
      entityType: 'Invoice',
      entityId: cmd.payload.invoiceId,
      jobId: cmd.payload.jobId,
      customerName: cmd.payload.customerName,
      branchId: cmd.payload.branchId,
      currency: cmd.payload.currency,
      items: cmd.payload.items,
      netAmount: net,
      vatAmount: vat,
      totalAmount: total,
      dueDate: cmd.payload.dueDate,
    });
    const vatEvt = await this.ledger.append('VATCalculated', cmd.metadata, {
      entityType: 'Invoice',
      entityId: cmd.payload.invoiceId,
      branchId: cmd.payload.branchId,
      rate: 0.16,
      netAmount: net,
      vatAmount: vat,
      month: new Date(cmd.metadata.timestamp).toISOString().slice(0, 7),
    });
    const journalEvt = await this.ledger.append('JournalEntryPosted', cmd.metadata, {
      entityType: 'Invoice',
      entityId: cmd.payload.invoiceId,
      description: 'Invoice posting',
      lines: [
        { account: 'Accounts Receivable', debit: total, credit: 0 },
        { account: 'Service Revenue', debit: 0, credit: net },
        { account: 'VAT Payable', debit: 0, credit: vat },
      ],
    });
    const debits = journalEvt.payload.lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const credits = journalEvt.payload.lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    if (Number(debits.toFixed(2)) !== Number(credits.toFixed(2))) throw new InvalidStateTransitionError('Journal not balanced');
    return { invoiceEvt, vatEvt, journalEvt };
  }

  async recordPayment(cmd: RecordPaymentCommand) {
    const tenant = cmd.metadata.tenant_id;
    const events = await this.ledger.replay(tenant);
    const invoiceEvt = events.find(e => e.event_name === 'InvoiceGenerated' && e.payload.entityId === cmd.payload.invoiceId);
    if (!invoiceEvt) throw new ValidationError('Invoice not found');
    const total = Number(invoiceEvt.payload.totalAmount || 0);
    const payments = events.filter(e => e.event_name === 'PaymentRecorded' && e.payload.invoiceId === cmd.payload.invoiceId);
    const paidSoFar = payments.reduce((s, p) => s + Number(p.payload.amount || 0), 0);
    const amount = Number(cmd.payload.amount || 0);
    if (!isFinite(amount) || amount <= 0) throw new ValidationError('Invalid payment amount');
    const outstanding = Number((total - paidSoFar).toFixed(2));
    if (amount > outstanding) throw new ValidationError('Overpayment not allowed');
    const payEvt = await this.ledger.append('PaymentRecorded', cmd.metadata, {
      entityType: 'Payment',
      entityId: cmd.payload.paymentId,
      invoiceId: cmd.payload.invoiceId,
      amount,
      paymentMethod: cmd.payload.paymentMethod,
      reference: cmd.payload.reference,
      receivedAt: cmd.payload.receivedAt,
      branchId: cmd.payload.branchId,
    });
    const accountMap: Record<string, string> = { cash: 'Cash', bank: 'Bank', mpesa: 'Mpesa' };
    const debitAccount = accountMap[cmd.payload.paymentMethod] || 'Cash';
    const journalEvt = await this.ledger.append('JournalEntryPosted', cmd.metadata, {
      entityType: 'Invoice',
      entityId: cmd.payload.invoiceId,
      description: 'Payment received',
      lines: [
        { account: debitAccount, debit: amount, credit: 0 },
        { account: 'Accounts Receivable', debit: 0, credit: amount },
      ],
    });
    const debits = journalEvt.payload.lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const credits = journalEvt.payload.lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    if (Number(debits.toFixed(2)) !== Number(credits.toFixed(2))) throw new InvalidStateTransitionError('Journal not balanced');
    return { payEvt, journalEvt, outstandingAfter: Number((outstanding - amount).toFixed(2)) };
  }
}