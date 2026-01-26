import { EventLedger, DomainEvent } from '../../../core/event-ledger/Ledger';

export interface StockMovementView {
  type: 'RECEIVED' | 'ISSUED';
  productId: string;
  branchId: string;
  quantity: number;
  unitCost?: number;
  jobId?: string;
}

export async function projectStockMovements(ledger: EventLedger, tenant_id: string): Promise<StockMovementView[]> {
  const evts = await ledger.replay(tenant_id);
  const views: StockMovementView[] = [];
  for (const e of evts as DomainEvent[]) {
    if (e.event_name === 'StockReceived') {
      views.push({ type: 'RECEIVED', productId: e.payload.productId, branchId: e.payload.branchId, quantity: Number(e.payload.quantity || 0), unitCost: Number(e.payload.unitCost || 0) });
    }
    if (e.event_name === 'StockIssued') {
      views.push({ type: 'ISSUED', productId: e.payload.productId, branchId: e.payload.branchId, quantity: Number(e.payload.quantity || 0), unitCost: Number(e.payload.unitCost || 0), jobId: e.payload.jobId });
    }
  }
  return views;
}

export async function projectInventoryBalance(ledger: EventLedger, tenant_id: string): Promise<Record<string, number>> {
  const moves = await projectStockMovements(ledger, tenant_id);
  const map = new Map<string, number>();
  for (const m of moves) {
    const key = `${m.branchId}:${m.productId}`;
    const prev = map.get(key) || 0;
    const next = m.type === 'RECEIVED' ? prev + m.quantity : prev - m.quantity;
    map.set(key, next);
  }
  return Object.fromEntries(map.entries());
}

export async function projectJobCost(ledger: EventLedger, tenant_id: string, jobId: string): Promise<number> {
  const evts = await ledger.replay(tenant_id);
  const partsCost = evts
    .filter(e => e.event_name === 'StockIssued' && e.payload.jobId === jobId)
    .reduce((s, e: any) => s + Number(e.payload.amount || 0), 0);
  const laborCost = evts
    .filter(e => e.event_name === 'LaborTimeRecorded' && e.payload.entityId === jobId)
    .reduce((s, e: any) => s + Number(e.payload.cost || 0), 0);
  return Number((partsCost + laborCost).toFixed(2));
}