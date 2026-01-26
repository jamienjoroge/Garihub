import { EventLedger } from '../../../core/event-ledger/Ledger';
import { IssueStockCommand } from './commands';
import { ValidationError, InvalidStateTransitionError } from '../../../core/errors/domain';

export class InventoryService {
  constructor(private ledger: EventLedger) {}

  async issueStock(cmd: IssueStockCommand) {
    const qty = Number(cmd.payload.quantity || 0);
    const cost = Number(cmd.payload.unitCost || 0);
    if (!isFinite(qty) || qty <= 0) throw new ValidationError('Invalid quantity');
    if (!isFinite(cost) || cost < 0) throw new ValidationError('Invalid unit cost');
    const events = await this.ledger.replay(cmd.metadata.tenant_id);
    const received = events.filter(e => e.event_name === 'StockReceived' && e.payload.branchId === cmd.payload.branchId && e.payload.productId === cmd.payload.productId);
    const issued = events.filter(e => e.event_name === 'StockIssued' && e.payload.branchId === cmd.payload.branchId && e.payload.productId === cmd.payload.productId);
    const available = received.reduce((s, r: any) => s + Number(r.payload.quantity || 0), 0) - issued.reduce((s, i: any) => s + Number(i.payload.quantity || 0), 0);
    if (qty > available) throw new ValidationError('Insufficient stock');
    const amount = Number((qty * cost).toFixed(2));
    const stockEvt = await this.ledger.append('StockIssued', cmd.metadata, {
      entityType: 'StockIssue',
      entityId: cmd.payload.issueId,
      jobId: cmd.payload.jobId,
      productId: cmd.payload.productId,
      quantity: qty,
      unitCost: cost,
      amount,
      branchId: cmd.payload.branchId,
    });
    const journalEvt = await this.ledger.append('JournalEntryPosted', cmd.metadata, {
      entityType: 'JobCard',
      entityId: cmd.payload.jobId,
      description: 'COGS recognized on stock issue',
      lines: [
        { account: 'Cost of Sales', debit: amount, credit: 0 },
        { account: 'Inventory Asset', debit: 0, credit: amount },
      ],
    });
    const debits = journalEvt.payload.lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const credits = journalEvt.payload.lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    if (Number(debits.toFixed(2)) !== Number(credits.toFixed(2))) throw new InvalidStateTransitionError('Journal not balanced');
    return { stockEvt, journalEvt };
  }
}