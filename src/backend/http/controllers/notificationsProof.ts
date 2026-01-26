import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectNotificationProof, projectUserNotificationProof } from '../../modules/notifications/read/proof';

export function createNotificationProofByIdController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const id = String((req.params as any).notificationId || '');
    const view = await projectNotificationProof(ledger, tenant, id);
    reply.code(200).send(view);
  };
}

export function createUserNotificationProofController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const userId = String((req.params as any).userId || '');
    const period = String((req.query as any)?.period || '');
    const view = await projectUserNotificationProof(ledger, tenant, userId, period);
    reply.code(200).send(view);
  };
}