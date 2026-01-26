import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectVehicleHistory, projectInspectionSummary } from '../../modules/customer-vehicles/read/models';
import { CustomerVehicleService } from '../../modules/customer-vehicles/write/services';
import { buildMetadata } from '../metadata';
import { VehicleAccessService } from '../../modules/customer-vehicles/write/accessService';

export function createVehicleHistoryController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const vehicleId = String((req.params as any).vehicleId || '');
    const view = await projectVehicleHistory(ledger, tenant, vehicleId);
    reply.code(200).send(view);
  };
}

export function createVehicleInspectionsController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || '');
    const vehicleId = String((req.params as any).vehicleId || '');
    const view = await projectInspectionSummary(ledger, tenant, vehicleId);
    reply.code(200).send(view);
  };
}

export function createRecordInspectionController(service: CustomerVehicleService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const vehicleId = String((req.params as any).vehicleId || '');
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'RecordInspection',
      metadata,
      payload: {
        inspectionId: body.inspectionId,
        vehicleId,
        inspectorId: body.inspectorId,
        inspectionType: body.inspectionType,
        findings: body.findings,
        passed: body.passed,
        notes: body.notes,
        date: body.date,
      },
    } as any;
    const evt = await service.recordInspection(cmd);
    reply.code(201).send(evt);
  };
}

export function createShareAccessController(accessService: VehicleAccessService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const vehicleId = String((req.params as any).vehicleId || '');
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'GrantVehicleHistoryAccess',
      metadata,
      payload: {
        vehicleId,
        tokenId: body.tokenId,
        expiresAt: body.expiresAt,
        issuedBy: metadata.user_id,
        reason: body.reason,
      },
    } as any;
    const evt = await accessService.grant(cmd);
    reply.code(201).send(evt);
  };
}