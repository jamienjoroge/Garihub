import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { validateToken } from '../../modules/customer-vehicles/read/access';
import { projectVehicleHistory, projectInspectionSummary } from '../../modules/customer-vehicles/read/models';
import { AuthorizationError, ValidationError } from '../../core/errors/domain';

export function createPublicVehicleHistoryController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String((req.headers as any)['x-tenant-id'] || '');
    const vehicleId = String((req.params as any).vehicleId || '');
    const token = String((req.query as any)?.token || '');
    if (!token) throw new ValidationError('Missing token');
    const ok = await validateToken(ledger, tenant, token, vehicleId);
    if (!ok.valid) throw new AuthorizationError('Invalid token');
    const view = await projectVehicleHistory(ledger, tenant, vehicleId);
    reply.code(200).send(view);
  };
}

export function createPublicVehicleInspectionsController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String((req.headers as any)['x-tenant-id'] || '');
    const vehicleId = String((req.params as any).vehicleId || '');
    const token = String((req.query as any)?.token || '');
    if (!token) throw new ValidationError('Missing token');
    const ok = await validateToken(ledger, tenant, token, vehicleId);
    if (!ok.valid) throw new AuthorizationError('Invalid token');
    const view = await projectInspectionSummary(ledger, tenant, vehicleId);
    reply.code(200).send(view);
  };
}