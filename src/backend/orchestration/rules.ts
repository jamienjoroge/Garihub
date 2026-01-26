import { EventLedger, DomainEvent } from '../core/event-ledger/Ledger';
import { randomUUID } from 'crypto';
import { CustomerVehicleService } from '../modules/customer-vehicles/write/services';
import { NotificationService } from '../modules/notifications/write/services';

export class OrchestrationRules {
  constructor(private ledger: EventLedger, private vehicleSvc: CustomerVehicleService, private notifSvc: NotificationService) {}

  async run(tenant_id: string) {
    const events = await this.ledger.replay(tenant_id);
    await this.handleJobCompleted(events);
    await this.handleServiceRecordMinted(events);
    await this.handleInspectionRecorded(events);
    await this.handleInvoiceGenerated(events);
    await this.handlePaymentRecorded(events);
  }

  private async handleJobCompleted(events: DomainEvent[]) {
    const completed = events.filter(e => e.event_name === 'JobCompleted');
    for (const c of completed) {
      const jobId = String((c.payload as any).entityId || (c.payload as any).job_id || '');
      const already = events.some(e => e.event_name === 'ServiceRecordMinted' && String((e.payload as any).jobId) === jobId);
      if (already) continue;
      const jobCreated = events.find(e => e.event_name === 'JobCardCreated' && String((e.payload as any).job?.id) === jobId) as DomainEvent | undefined;
      if (!jobCreated) continue;
      const vehicleId = String((jobCreated.payload as any).job?.vehicle?.id || '');
      const mileage = Number((jobCreated.payload as any).job?.mileage || 0);
      const cmd = {
        command_name: 'MintServiceRecord',
        metadata: { tenant_id: c.metadata.tenant_id, branch_id: c.metadata.branch_id, user_id: c.metadata.user_id, timestamp: new Date().toISOString(), correlation_id: randomUUID() },
        payload: { vehicleId, jobId, date: new Date().toISOString(), summary: 'Service record minted on job completion', mileage },
      } as any;
      await this.vehicleSvc.mintServiceRecord(cmd);
    }
  }

  private async handleServiceRecordMinted(events: DomainEvent[]) {
    const minted = events.filter(e => e.event_name === 'ServiceRecordMinted');
    for (const m of minted) {
      const jobId = String((m.payload as any).jobId || '');
      const jobCreated = events.find(e => e.event_name === 'JobCardCreated' && String((e.payload as any).job?.id) === jobId) as DomainEvent | undefined;
      if (!jobCreated) continue;
      const userId = String((jobCreated.payload as any).job?.vehicle?.ownerName || '');
      const exists = events.some(e => e.event_name === 'NotificationRequested' && String((e.payload as any).targetRef) === jobId && String((e.payload as any).template) === 'SERVICE_RECORD_READY');
      if (exists) continue;
      const cmd = {
        command_name: 'RequestNotification',
        metadata: { tenant_id: m.metadata.tenant_id, branch_id: m.metadata.branch_id, user_id: m.metadata.user_id, timestamp: new Date().toISOString(), correlation_id: randomUUID() },
        payload: { notificationId: `N-${randomUUID()}`, userId, channel: 'sms', template: 'SERVICE_RECORD_READY', targetRef: jobId, payload: { jobId, vehicleId: (m.payload as any).vehicleId } },
      } as any;
      await this.notifSvc.request(cmd);
    }
  }

  private async handleInspectionRecorded(events: DomainEvent[]) {
    const rec = events.filter(e => e.event_name === 'InspectionRecorded');
    for (const i of rec) {
      const vehicleId = String((i.payload as any).vehicleId || '');
      const jobCard = events.find(e => e.event_name === 'JobCardCreated' && String((e.payload as any).job?.vehicle?.id) === vehicleId) as DomainEvent | undefined;
      const userId = jobCard ? String((jobCard.payload as any).job?.vehicle?.ownerName || '') : 'customer';
      const exists = events.some(e => e.event_name === 'NotificationRequested' && String((e.payload as any).targetRef) === vehicleId && String((e.payload as any).template) === 'INSPECTION_COMPLETED');
      if (exists) continue;
      const cmd = {
        command_name: 'RequestNotification',
        metadata: { tenant_id: i.metadata.tenant_id, branch_id: i.metadata.branch_id, user_id: i.metadata.user_id, timestamp: new Date().toISOString(), correlation_id: randomUUID() },
        payload: { notificationId: `N-${randomUUID()}`, userId, channel: 'sms', template: 'INSPECTION_COMPLETED', targetRef: vehicleId, payload: { vehicleId, passed: (i.payload as any).passed } },
      } as any;
      await this.notifSvc.request(cmd);
    }
  }

  private async handleInvoiceGenerated(events: DomainEvent[]) {
    const invs = events.filter(e => e.event_name === 'InvoiceGenerated');
    for (const inv of invs) {
      const id = String((inv.payload as any).entityId || '');
      const exists = events.some(e => e.event_name === 'NotificationRequested' && String((e.payload as any).targetRef) === id && String((e.payload as any).template) === 'INVOICE_READY');
      if (exists) continue;
      const userId = String((inv.payload as any).customerName || '');
      const cmd = {
        command_name: 'RequestNotification',
        metadata: { tenant_id: inv.metadata.tenant_id, branch_id: inv.metadata.branch_id, user_id: inv.metadata.user_id, timestamp: new Date().toISOString(), correlation_id: randomUUID() },
        payload: { notificationId: `N-${randomUUID()}`, userId, channel: 'sms', template: 'INVOICE_READY', targetRef: id, payload: { invoiceId: id, total: (inv.payload as any).totalAmount } },
      } as any;
      await this.notifSvc.request(cmd);
    }
  }

  private async handlePaymentRecorded(events: DomainEvent[]) {
    const pays = events.filter(e => e.event_name === 'PaymentRecorded');
    for (const p of pays) {
      const id = String((p.payload as any).invoiceId || '');
      const exists = events.some(e => e.event_name === 'NotificationRequested' && String((e.payload as any).targetRef) === id && String((e.payload as any).template) === 'PAYMENT_RECEIVED');
      if (exists) continue;
      const userId = 'customer';
      const cmd = {
        command_name: 'RequestNotification',
        metadata: { tenant_id: p.metadata.tenant_id, branch_id: p.metadata.branch_id, user_id: p.metadata.user_id, timestamp: new Date().toISOString(), correlation_id: randomUUID() },
        payload: { notificationId: `N-${randomUUID()}`, userId, channel: 'sms', template: 'PAYMENT_RECEIVED', targetRef: id, payload: { invoiceId: id, amount: (p.payload as any).amount } },
      } as any;
      await this.notifSvc.request(cmd);
    }
  }
}