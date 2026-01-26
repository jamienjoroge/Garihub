import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../../modules/auth/write/services';

export function createAuthControllers(auth: AuthService) {
  return {
    requestOtp: async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant = String((req.headers as any)['x-tenant-id'] || '');
      const body = (req.body || {}) as any;
      const metadata = { tenant_id: tenant, branch_id: '', user_id: 'auth', timestamp: new Date().toISOString(), correlation_id: String((req.headers as any)['x-correlation-id'] || '') };
      const res = await auth.requestOtp({ command_name: 'RequestOtp', metadata, payload: { phone: String(body.phone || ''), tenant_id: tenant } });
      reply.code(200).send(res);
    },
    verifyOtp: async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant = String((req.headers as any)['x-tenant-id'] || '');
      const body = (req.body || {}) as any;
      const metadata = { tenant_id: tenant, branch_id: '', user_id: 'auth', timestamp: new Date().toISOString(), correlation_id: String((req.headers as any)['x-correlation-id'] || '') };
      const res = await auth.verifyOtp({ command_name: 'VerifyOtp', metadata, payload: { otpId: String(body.otpId || ''), phone: String(body.phone || ''), code: String(body.code || ''), tenant_id: tenant } });
      reply.code(200).send(res);
    },
  };
}