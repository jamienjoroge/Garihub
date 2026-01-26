import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { buildManagerMonthlySummary, buildJobProfitability } from '../../modules/reporting-read-models/manager';

export function createManagerSummaryController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const month = String((req.query as any)?.month || '');
    const result = await buildManagerMonthlySummary(ledger, tenant, month);
    reply.code(200).send(result);
  };
}

export function createJobProfitabilityController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const result = await buildJobProfitability(ledger, tenant);
    reply.code(200).send(result);
  };
}