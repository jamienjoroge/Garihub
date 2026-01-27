import { createServer } from './server.ts';
import { createEventLedger } from '../core/event-ledger/Ledger.ts';
import { AuthService } from '../modules/auth/write/services.ts';
import { createAuthControllers } from './controllers/auth.ts';

async function main() {
  try {
    const ledger = await createEventLedger({});
    const authService = new AuthService(ledger);

    const notImpl = async (_req: any, reply: any) => { reply.code(501).send({ errorCode: 'NOT_IMPLEMENTED' }); };

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
      customerVehicles: { list: notImpl },
      preferences: { notifications: notImpl },
      notificationsInbox: { list: notImpl },
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