import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { generateVehicleHistoryPdf } from '../../modules/customer-vehicles/read/pdf';

export function createVehiclePdfController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const tenant = String((req.headers as any)['x-tenant-id'] || '');
    const vehicleId = String((req.params as any).vehicleId || '');
    const tokenId = String((req.query as any)?.tokenId || '');
    const buf = await generateVehicleHistoryPdf(ledger, tenant, vehicleId, tokenId || undefined);
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="vehicle-${vehicleId}-history.pdf"`);
    reply.code(200).send(buf);
  };
}