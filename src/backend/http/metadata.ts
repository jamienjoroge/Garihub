import { EventMetadata } from '../contracts/common';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

export function buildMetadata(req: FastifyRequest): EventMetadata {
  const headers = req.headers as any;
  const auth = (req as any).auth as any;
  const tenant_id = String((auth && auth.tenant_id) || headers['x-tenant-id'] || '');
  const branch_id = String((auth && Array.isArray(auth.branchIds) && auth.branchIds[0]) || headers['x-branch-id'] || '');
  const user_id = String((auth && auth.userId) || headers['x-user-id'] || '');
  const correlation_id = String(headers['x-correlation-id'] || randomUUID());
  const timestamp = new Date().toISOString();
  return { tenant_id, branch_id, user_id, correlation_id, timestamp };
}