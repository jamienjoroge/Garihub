import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { registerErrorMiddleware } from './errors.ts';
import { buildKey, checkAndReturn, store } from './idempotency.ts';
import { registerAuthMiddleware } from './authMiddleware.ts';

export interface JobControllers {
  create: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  start: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  addPart: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  recordLabor: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  complete: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

export interface ServerDeps {
  jobs: JobControllers;
  invoices: { create: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  payments: { record: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  inventory: { issue: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  manager: { summary: (req: FastifyRequest, reply: FastifyReply) => Promise<void>; jobsProfitability: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  vehicles: { history: (req: FastifyRequest, reply: FastifyReply) => Promise<void>; inspections: (req: FastifyRequest, reply: FastifyReply) => Promise<void>; recordInspection: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  public: { history: (req: FastifyRequest, reply: FastifyReply) => Promise<void>; inspections: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  share: { create: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  webhooks: { smsReceipt: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  admin: { reconcile: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  notificationsProof: { byId: (req: FastifyRequest, reply: FastifyReply) => Promise<void>; byUser: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  notificationsPublic: { byId: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  customerVehicles: { list: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  preferences: { notifications: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  notificationsInbox: { list: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  vehiclePdf: { history: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
  auth: { requestOtp: (req: FastifyRequest, reply: FastifyReply) => Promise<void>; verifyOtp: (req: FastifyRequest, reply: FastifyReply) => Promise<void> };
}

export function createServer(deps: ServerDeps): FastifyInstance {
  const app = Fastify({ logger: false });
  app.addHook('onRequest', async (req, reply) => {
    const origin = String((req.headers as any).origin || '');
    const allow = origin === 'https://garihub-1.onrender.com'
      || origin === 'http://localhost:3000'
      || origin === 'http://localhost:5173'
      || origin.endsWith('.onrender.com');
    if (allow) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Vary', 'Origin');
      reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-correlation-id, x-branch-id, x-tenant-id, x-webhook-secret, x-admin-secret');
    }
    if (req.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });
  registerErrorMiddleware(app);
  registerAuthMiddleware(app);
  app.addHook('preHandler', async (req, reply) => {
    const key = buildKey(req.headers as any);
    if (key && key !== ':' ) {
      const cached = checkAndReturn(key);
      if (cached) {
        reply.code(cached.status).send(cached.payload);
        return;
      }
      (req as any).__idem_key = key;
    }
  });
  app.addHook('onSend', async (req, reply, payload) => {
    const key = (req as any).__idem_key as string | undefined;
    if (!key) return payload as any;
    const status = reply.statusCode;
    if (status >= 200 && status < 300) {
      try {
        const parsed = typeof payload === 'string' ? JSON.parse(payload as any) : payload;
        store(key, { status, payload: parsed });
      } catch {
        store(key, { status, payload });
      }
    }
    return payload as any;
  });
  app.post('/api/jobs', deps.jobs.create);
  app.post('/api/jobs/:id/start', deps.jobs.start);
  app.post('/api/jobs/:id/parts', deps.jobs.addPart);
  app.post('/api/jobs/:id/labor', deps.jobs.recordLabor);
  app.post('/api/jobs/:id/complete', deps.jobs.complete);
  app.post('/api/invoices', deps.invoices.create);
  app.post('/api/payments', deps.payments.record);
  app.post('/api/inventory/issue', deps.inventory.issue);
  app.get('/api/manager/summary', deps.manager.summary);
  app.get('/api/manager/jobs/profitability', deps.manager.jobsProfitability);
  app.get('/api/vehicles/:vehicleId/history', deps.vehicles.history);
  app.get('/api/vehicles/:vehicleId/inspections', deps.vehicles.inspections);
  app.post('/api/vehicles/:vehicleId/inspections', deps.vehicles.recordInspection);
  app.get('/api/vehicles', deps.customerVehicles.list);
  app.put('/api/me/preferences/notifications', deps.preferences.notifications);
  app.get('/api/me/notifications', deps.notificationsInbox.list);
  app.post('/api/vehicles/:vehicleId/share', deps.share.create);
  app.get('/api/vehicles/:vehicleId/history.pdf', deps.vehiclePdf.history);
  app.post('/api/auth/request-otp', deps.auth.requestOtp);
  app.post('/api/auth/verify-otp', deps.auth.verifyOtp);
  app.get('/public/vehicles/:vehicleId/history', deps.public.history);
  app.get('/public/vehicles/:vehicleId/inspections', deps.public.inspections);
  app.post('/webhooks/sms/delivery-receipt', deps.webhooks.smsReceipt);
  app.post('/api/admin/notifications/reconcile', deps.admin.reconcile);
  app.get('/api/notifications/:notificationId/proof', deps.notificationsProof.byId);
  app.get('/api/notifications/proof/user/:userId', deps.notificationsProof.byUser);
  app.get('/public/notifications/:notificationId/proof', deps.notificationsPublic.byId);
  return app;
}