import { createServer } from './server.ts';
import { createEventLedger } from '../core/event-ledger/Ledger.ts';
import { AuthService } from '../modules/auth/write/services.ts';
import { createAuthControllers } from './controllers/auth.ts';
import type { EventLedger } from '../core/event-ledger/Ledger.ts';

async function main() {
  try {
    const ledger = await createEventLedger({});
    const authService = new AuthService(ledger);

    const notImpl = async (_req: any, reply: any) => { reply.code(501).send({ errorCode: 'NOT_IMPLEMENTED' }); };
    function createCustomerVehiclesListControllerInline(ledger: EventLedger) {
      return async function handler(req: any, reply: any) {
        const tenant = String((req?.auth?.tenant_id) || req.headers['x-tenant-id'] || '');
        const userId = String((req?.auth?.userId) || req.headers['x-user-id'] || '');
        const evts = await ledger.replay(tenant);
        const items = new Map<string, any>();
        for (const e of evts as any[]) {
          if (e.event_name === 'JobCardCreated') {
            const v = (e.payload as any).job?.vehicle;
            if (!v) continue;
            const owner = String(v.ownerName || '');
            if (owner === userId) {
              items.set(v.id, { vehicleId: v.id, make: v.make, model: v.model, year: v.year, vin: v.vin });
            }
          }
        }
        for (const e of evts as any[]) {
          if (e.event_name === 'ServiceRecordMinted') {
            const vid = (e.payload as any).vehicleId as string;
            const it = items.get(vid);
            if (it) it.lastServiceDate = e.metadata.timestamp;
          }
          if (e.event_name === 'JobCompleted') {
            const jobId = (e.payload as any).entityId as string;
            const jc = evts.find((x: any) => x.event_name === 'JobCardCreated' && String((x.payload as any).job?.id) === jobId) as any | undefined;
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
        reply.code(200).send(Array.from(items.values()));
      };
    }
    function createNotificationsInboxControllerInline(ledger: EventLedger) {
      return async function handler(req: any, reply: any) {
        const tenant = String((req?.auth?.tenant_id) || req.headers['x-tenant-id'] || '');
        const userId = String((req?.auth?.userId) || req.headers['x-user-id'] || '');
        const period = String((req.query as any)?.period || '');
        const events = await ledger.replay(tenant);
        const requested = events.filter((e: any) => e.event_name === 'NotificationRequested' && String((e.payload as any).userId) === userId && (!period || String((e.payload as any).requestedAt).slice(0,7) === period));
        const items: any[] = [];
        for (const r of requested) {
          const id = String((r.payload as any).notificationId);
          const attempts = events.filter((e: any) => e.event_name === 'NotificationDeliveryAttempted' && String((e.payload as any).notificationId) === id);
          const delivered = events.find((e: any) => e.event_name === 'NotificationDelivered' && String((e.payload as any).notificationId) === id);
          const lastAttempt = attempts.length ? attempts[attempts.length - 1] : undefined;
          let latestStatus: 'PENDING' | 'DELIVERED' | 'FAILED' | 'RETRYING' | 'RATE_LIMITED' | 'BUDGET_EXCEEDED' = 'PENDING';
          let lastUpdatedAt = (r.payload as any).requestedAt;
          if (delivered) {
            latestStatus = (delivered.payload as any).status === 'DELIVERED' ? 'DELIVERED' : 'FAILED';
            lastUpdatedAt = (delivered.payload as any).deliveredAt;
          } else if (lastAttempt) {
            const fr = String((lastAttempt.payload as any).failureReason || '');
            if (fr === 'RATE_LIMITED') latestStatus = 'RATE_LIMITED';
            else if (fr === 'BUDGET_EXCEEDED') latestStatus = 'BUDGET_EXCEEDED';
            else if ((lastAttempt.payload as any).status === 'FAILED') latestStatus = 'FAILED';
            else latestStatus = 'RETRYING';
            lastUpdatedAt = (lastAttempt.payload as any).attemptedAt;
          }
          const proofGranted = events.some((e: any) => e.event_name === 'NotificationProofAccessGranted' && String((e.payload as any).notificationId) === id);
          items.push({
            notificationId: id,
            template: String((r.payload as any).template),
            channel: (r.payload as any).channel,
            requestedAt: (r.payload as any).requestedAt,
            latestStatus,
            lastUpdatedAt,
            proofLinkAvailable: proofGranted,
          });
        }
        reply.code(200).send(items);
      };
    }

    const app = createServer({
      jobs: { create: notImpl, start: notImpl, addPart: notImpl, recordLabor: notImpl, complete: notImpl },
      invoices: { create: notImpl },
      payments: { record: notImpl },
      inventory: { issue: notImpl },
      manager: { summary: notImpl, jobsProfitability: notImpl },
      vehicles: { history: notImpl, inspections: notImpl, recordInspection: notImpl },
      public: { history: notImpl, inspections: notImpl },
      share: { create: notImpl },
      webhooks: { smsReceipt: notImpl },
      admin: { reconcile: notImpl },
      notificationsProof: { byId: notImpl, byUser: notImpl },
      notificationsPublic: { byId: notImpl },
      customerVehicles: { list: createCustomerVehiclesListControllerInline(ledger) },
      preferences: { notifications: notImpl },
      notificationsInbox: { list: createNotificationsInboxControllerInline(ledger) },
      vehiclePdf: { history: notImpl },
      auth: createAuthControllers(authService),
    } as any);

    const port = Number(process.env.PORT || 3000);
    await app.listen({ host: '0.0.0.0', port });
    console.log(`API listening on 0.0.0.0:${port}`);
  } catch (err) {
    console.error('API startup failed', err);
    console.error(err?.stack || err);
    process.exit(1);
  }
}

main();