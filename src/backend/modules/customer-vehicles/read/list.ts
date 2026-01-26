import { EventLedger, DomainEvent } from '../../../core/event-ledger/Ledger';

export interface CustomerVehicleListItem {
  vehicleId: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  lastServiceDate?: string;
  lastInspectionResult?: 'PASS' | 'FAIL' | 'WARN' | 'PENDING';
}

export async function projectCustomerVehiclesList(ledger: EventLedger, tenant_id: string, userId: string): Promise<CustomerVehicleListItem[]> {
  const evts = await ledger.replay(tenant_id);
  const items = new Map<string, CustomerVehicleListItem>();
  for (const e of evts as DomainEvent[]) {
    if (e.event_name === 'JobCardCreated') {
      const v = (e.payload as any).job?.vehicle;
      if (!v) continue;
      // Known limitation: using ownerName as userId mapping until explicit links exist
      const owner = String(v.ownerName || '');
      if (owner === userId) {
        items.set(v.id, { vehicleId: v.id, make: v.make, model: v.model, year: v.year, vin: v.vin });
      }
    }
  }
  for (const e of evts as DomainEvent[]) {
    if (e.event_name === 'ServiceRecordMinted') {
      const vid = (e.payload as any).vehicleId as string;
      const it = items.get(vid);
      if (it) it.lastServiceDate = e.metadata.timestamp;
    }
    if (e.event_name === 'JobCompleted') {
      const jobId = (e.payload as any).entityId as string;
      const jc = evts.find(x => x.event_name === 'JobCardCreated' && String((x.payload as any).job?.id) === jobId) as DomainEvent | undefined;
      const vid = jc ? (jc.payload as any).job?.vehicle?.id : undefined;
      if (vid) {
        const it = items.get(vid);
        if (it && !it.lastServiceDate) it.lastServiceDate = e.metadata.timestamp;
      }
    }
    if (e.event_name === 'InspectionRecorded') {
      const vid = (e.payload as any).vehicleId as string;
      const it = items.get(vid);
      if (it) it.lastInspectionResult = (e.payload as any).passed ? 'PASS' : 'FAIL';
    }
  }
  return Array.from(items.values());
}