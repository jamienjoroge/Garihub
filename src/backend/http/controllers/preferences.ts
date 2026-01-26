import { FastifyRequest, FastifyReply } from 'fastify';
import { PreferencesService } from '../../modules/customer-vehicles/write/preferencesService';

export function createNotificationPreferencesController(prefs: PreferencesService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const auth = (req as any).auth as any;
    const tenant_id = String((auth && auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const userId = String((auth && auth.userId) || (req.headers as any)['x-user-id'] || '');
    const metadata = {
      tenant_id,
      branch_id: String((auth && Array.isArray(auth.branchIds) && auth.branchIds[0]) || (req.headers as any)['x-branch-id'] || ''),
      user_id: userId,
      timestamp: new Date().toISOString(),
      correlation_id: String((req.headers as any)['x-correlation-id'] || ''),
    };
    const body = (req.body || {}) as any;
    await prefs.update(tenant_id, userId, !!body.smsOptIn, !!body.emailOptIn, metadata);
    reply.code(200).send({ ok: true });
  };
}