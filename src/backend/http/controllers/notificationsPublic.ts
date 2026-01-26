import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { validateNotificationToken } from '../../modules/notifications/read/access';
import { projectNotificationProof } from '../../modules/notifications/read/proof';
import { ValidationError, AuthorizationError } from '../../core/errors/domain';

export function createPublicNotificationProofController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String((req.headers as any)['x-tenant-id'] || '');
    const id = String((req.params as any).notificationId || '');
    const token = String((req.query as any)?.token || '');
    if (!token) throw new ValidationError('Missing token');
    const ok = await validateNotificationToken(ledger, tenant, token, id);
    if (!ok.valid) throw new AuthorizationError('Invalid token');
    const view = await projectNotificationProof(ledger, tenant, id);
    reply.code(200).send(view);
  };
}