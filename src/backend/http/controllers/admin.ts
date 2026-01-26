import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { ReconcileService } from '../../modules/notifications/write/reconcileService';

export function createNotificationsReconcileController(ledger: EventLedger) {
  const svc = new ReconcileService();
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const secret = String((req.headers as any)['x-admin-secret'] || '');
    if (secret !== String(process.env.ADMIN_SECRET || '')) {
      reply.code(403).send({ errorCode: 'AUTHORIZATION_ERROR', message: 'Invalid admin secret', correlation_id: String((req.headers as any)['x-correlation-id'] || '') });
      return;
    }
    const tenant_id = String((req.headers as any)['x-tenant-id'] || '');
    await svc.run(ledger, tenant_id, new Date().toISOString());
    reply.code(200).send({ ok: true });
  };
}