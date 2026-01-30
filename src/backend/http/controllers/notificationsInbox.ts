import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectUserNotificationInbox } from '../../modules/notifications/read/inbox.ts';

export function createNotificationsInboxController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const userId = String(((req as any).auth && (req as any).auth.userId) || (req.headers as any)['x-user-id'] || '');
    const period = String((req.query as any)?.period || '');
    const items = await projectUserNotificationInbox(ledger, tenant, userId, period || undefined);
    reply.code(200).send(items);
  };
}