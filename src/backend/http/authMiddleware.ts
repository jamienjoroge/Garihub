import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHmac } from 'crypto';

function verifyToken(token: string) {
  const secret = process.env.AUTH_SECRET || 'dev-secret';
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = createHmac('sha256', secret).update(data).digest('hex');
  if (sig !== expected) return null;
  try {
    const json = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    return json;
  } catch {
    return null;
  }
}

export function registerAuthMiddleware(app: FastifyInstance) {
  app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    const url = String((req as any).raw?.url || req.url || '');
    if (url.startsWith('/public/') || url.startsWith('/webhooks/') || url.startsWith('/api/auth/')) return;
    const authHeader = String((req.headers as any)['authorization'] || '');
    if (!authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ errorCode: 'AUTHORIZATION_ERROR', message: 'Missing token', correlation_id: String((req.headers as any)['x-correlation-id'] || '') });
      return;
    }
    const token = authHeader.slice(7);
    const claims = verifyToken(token);
    if (!claims) {
      reply.code(401).send({ errorCode: 'AUTHORIZATION_ERROR', message: 'Invalid token', correlation_id: String((req.headers as any)['x-correlation-id'] || '') });
      return;
    }
    (req as any).auth = { tenant_id: claims.tenant_id, userId: claims.userId, role: claims.role, branchIds: claims.branchIds || [] };
  });
}