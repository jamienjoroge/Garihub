import { createServer } from './server.ts';
import { EventLedger } from '../core/event-ledger/Ledger.ts';
import { InventoryService } from '../modules/inventory/write/services.ts';
import { FinanceService } from '../modules/finance-accounting/write/services.ts';
import { CustomerVehicleService } from '../modules/customer-vehicles/write/services.ts';
import { VehicleAccessService } from '../modules/customer-vehicles/write/accessService.ts';
import { PreferencesService } from '../modules/customer-vehicles/write/preferencesService.ts';
import { AuthService } from '../modules/auth/write/services.ts';
import { createIssueStockController } from './controllers/inventory.ts';
import { createInvoiceController } from './controllers/invoices.ts';
import { createPaymentController } from './controllers/payments.ts';
import { createVehicleHistoryController, createVehicleInspectionsController, createRecordInspectionController, createShareAccessController } from './controllers/vehicles.ts';
import { createManagerSummaryController, createJobProfitabilityController } from './controllers/manager.ts';
import { createCustomerVehiclesListController } from './controllers/customerVehiclesList.ts';
import { createNotificationPreferencesController } from './controllers/preferences.ts';
import { createNotificationsInboxController } from './controllers/notificationsInbox.ts';
import { createVehiclePdfController } from './controllers/vehiclePdf.ts';
import { createPublicVehicleHistoryController, createPublicVehicleInspectionsController } from './controllers/public.ts';
import { createNotificationProofByIdController, createUserNotificationProofController } from './controllers/notificationsProof.ts';
import { createPublicNotificationProofController } from './controllers/notificationsPublic.ts';
import { createSmsReceiptWebhookController } from './controllers/webhooks.ts';
import { createNotificationsReconcileController } from './controllers/admin.ts';
import { AuthzPolicy, CustomerGateway, VehicleGateway, ReadModelGateway } from '../modules/job-management/app/services.ts';
import { createAuthControllers } from './controllers/auth.ts';

async function start() {
  const ledger = new EventLedger({});

  const authz: AuthzPolicy = {
    async canCreateJob() { return true; },
    async canChangeStatus() { return true; },
    async canCompleteJob() { return true; },
  };
  const customers: CustomerGateway = { async exists() { return true; } };
  const vehicles: VehicleGateway = { async exists() { return true; } };
  const reads: ReadModelGateway = {
    async partsForJob() { return []; },
    async laborForJob() { return []; },
  };

  // Minimal job handlers to ensure server starts without requiring full job wiring
  const jobsHandlers = {
    create: async (_req: any, reply: any) => { reply.code(501).send({ errorCode: 'NOT_IMPLEMENTED' }); },
    start: async (_req: any, reply: any) => { reply.code(501).send({ errorCode: 'NOT_IMPLEMENTED' }); },
    addPart: async (_req: any, reply: any) => { reply.code(501).send({ errorCode: 'NOT_IMPLEMENTED' }); },
    recordLabor: async (_req: any, reply: any) => { reply.code(501).send({ errorCode: 'NOT_IMPLEMENTED' }); },
    complete: async (_req: any, reply: any) => { reply.code(501).send({ errorCode: 'NOT_IMPLEMENTED' }); },
  };
  const finance = new FinanceService(ledger);
  const inventory = new InventoryService(ledger);
  const cvService = new CustomerVehicleService(ledger);
  const accessService = new VehicleAccessService(ledger);
  const prefsService = new PreferencesService(ledger);
  const authService = new AuthService(ledger);

  const app = createServer({
    jobs: jobsHandlers,
    invoices: { create: createInvoiceController(finance) },
    payments: { record: createPaymentController(finance) },
    inventory: { issue: createIssueStockController(inventory) },
    manager: { summary: createManagerSummaryController(ledger), jobsProfitability: createJobProfitabilityController(ledger) },
    vehicles: { history: createVehicleHistoryController(ledger), inspections: createVehicleInspectionsController(ledger), recordInspection: createRecordInspectionController(cvService) },
    public: { history: createPublicVehicleHistoryController(ledger), inspections: createPublicVehicleInspectionsController(ledger) },
    share: { create: createShareAccessController(accessService) },
    webhooks: { smsReceipt: createSmsReceiptWebhookController(ledger) },
    admin: { reconcile: createNotificationsReconcileController(ledger) },
    notificationsProof: { byId: createNotificationProofByIdController(ledger), byUser: createUserNotificationProofController(ledger) },
    notificationsPublic: { byId: createPublicNotificationProofController(ledger) },
    customerVehicles: { list: createCustomerVehiclesListController(ledger) },
    preferences: { notifications: createNotificationPreferencesController(prefsService) },
    notificationsInbox: { list: createNotificationsInboxController(ledger) },
    vehiclePdf: { history: createVehiclePdfController(ledger) },
    auth: createAuthControllers(authService),
  } as any);

  try {
    const port = Number(process.env.PORT || 3000);
    await app.listen({ host: '0.0.0.0', port });
    console.log(`API listening on 0.0.0.0:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();