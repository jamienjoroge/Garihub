import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectCustomerVehiclesList } from '../../modules/customer-vehicles/read/list';

export function createCustomerVehiclesListController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const userId = String(((req as any).auth && (req as any).auth.userId) || (req.headers as any)['x-user-id'] || '');
    const view = await projectCustomerVehiclesList(ledger, tenant, userId);
    reply.code(200).send(view);
  };
}