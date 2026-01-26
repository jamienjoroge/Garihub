import { EventLedger, DomainEvent } from '../../../core/event-ledger/Ledger';

export interface VehicleHistoryTimelineItem {
  type: 'JobCardCreated' | 'ServiceRecordMinted' | 'InspectionRecorded' | 'InvoiceGenerated';
  date: string;
  details: any;
}

export interface VehicleHistoryView {
  vehicleId: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  timeline: VehicleHistoryTimelineItem[];
}

export async function projectVehicleHistory(ledger: EventLedger, tenant_id: string, vehicleId: string): Promise<VehicleHistoryView> {
  const evts = await ledger.replay(tenant_id);
  const timeline: VehicleHistoryTimelineItem[] = [];
  let make: string | undefined;
  let model: string | undefined;
  let year: number | undefined;
  let vin: string | undefined;
  for (const e of evts as DomainEvent[]) {
    if (e.event_name === 'JobCardCreated') {
      const v = e.payload.job?.vehicle;
      if (v?.id === vehicleId) {
        make = v.make; model = v.model; year = v.year; vin = v.vin;
        timeline.push({ type: 'JobCardCreated', date: e.metadata.timestamp, details: { jobId: e.payload.job?.id, issueDescription: e.payload.job?.issueDescription } });
      }
    }
    if (e.event_name === 'ServiceRecordMinted') {
      if (e.payload.vehicleId === vehicleId) {
        timeline.push({ type: 'ServiceRecordMinted', date: e.metadata.timestamp, details: e.payload });
      }
    }
    if (e.event_name === 'InspectionRecorded') {
      if (e.payload.vehicleId === vehicleId) {
        timeline.push({ type: 'InspectionRecorded', date: e.metadata.timestamp, details: e.payload });
      }
    }
    if (e.event_name === 'InvoiceGenerated') {
      const jobId = e.payload.jobId;
      // Link via job card if vehicle matches
      const related = evts.find(x => x.event_name === 'JobCardCreated' && x.payload.job?.id === jobId && x.payload.job?.vehicle?.id === vehicleId);
      if (related) timeline.push({ type: 'InvoiceGenerated', date: e.metadata.timestamp, details: { invoiceId: e.payload.entityId, totalAmount: e.payload.totalAmount } });
    }
  }
  timeline.sort((a, b) => a.date.localeCompare(b.date));
  return { vehicleId, make, model, year, vin, timeline };
}

export interface InspectionSummaryView {
  vehicleId: string;
  inspections: { id: string; type: string; date: string; passed: boolean }[];
  lastInspectionDate?: string;
  lastResult?: 'PASS' | 'FAIL';
  inspectionCount: number;
}

export async function projectInspectionSummary(ledger: EventLedger, tenant_id: string, vehicleId: string): Promise<InspectionSummaryView> {
  const evts = await ledger.replay(tenant_id, { event_name: 'InspectionRecorded' });
  const list = (evts as any[]).filter(e => e.payload.vehicleId === vehicleId).map(e => ({ id: e.payload.inspectionId, type: e.payload.inspectionType, date: e.payload.date || e.metadata?.timestamp, passed: !!e.payload.passed }));
  list.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const last = list[list.length - 1];
  return { vehicleId, inspections: list, lastInspectionDate: last?.date, lastResult: last ? (last.passed ? 'PASS' : 'FAIL') : undefined, inspectionCount: list.length };
}