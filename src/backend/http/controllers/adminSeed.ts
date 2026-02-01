import { FastifyRequest, FastifyReply } from 'fastify';
import type { EventLedger } from '../../core/event-ledger/Ledger.ts';

export function createAdminSeedController(ledger: EventLedger) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const adminSecretHeader = String((req.headers as any)['x-admin-secret'] || '');
    const adminSecret = String(process.env.ADMIN_SECRET || '');
    if (adminSecretHeader !== adminSecret) {
      reply.code(403).send({ errorCode: 'AUTHORIZATION_ERROR', message: 'Invalid admin secret', correlation_id: String((req.headers as any)['x-correlation-id'] || '') });
      return;
    }
    const tenant = String(((req as any).auth && (req as any).auth.tenant_id) || (req.headers as any)['x-tenant-id'] || 't1');
    const branch = String(((req as any).auth && (req as any).auth.branchIds && (req as any).auth.branchIds[0]) || 'b1');
    const userId = String(((req as any).auth && (req as any).auth.userId) || (req.headers as any)['x-user-id'] || 'u');
    const correlation = String((req.headers as any)['x-correlation-id'] || `seed-demo-${tenant}`);
    const now = new Date().toISOString();

    const existing = await ledger.auditTrail(tenant, { type: 'JobCard', id: 'job-demo-1' });
    if (existing.length > 0) {
      reply.code(200).send({ seeded: false, vehicleId: 'veh-demo-1', jobId: 'job-demo-1' });
      return;
    }

    const m = { tenant_id: tenant, branch_id: branch, user_id: userId, timestamp: now, correlation_id: correlation } as any;

    const job = { id: 'job-demo-1', vehicle: { id: 'veh-demo-1', plateNumber: 'KDA 001A', make: 'Toyota', model: 'Fielder', year: 2015, vin: 'VIN-DEMO-1', ownerName: userId }, status: 'COMPLETED', entryDate: now, issueDescription: 'Demo Service', estimatedCost: 0 } as any;
    await ledger.append('JobCardCreated', m, { job, entityType: 'JobCard', entityId: 'job-demo-1' });
    await ledger.append('JobCompleted', m, { entityType: 'JobCard', entityId: 'job-demo-1', notes: 'Demo completion' });
    await ledger.append('ServiceRecordMinted', m, { vehicleId: 'veh-demo-1', jobId: 'job-demo-1', date: now, summary: 'Oil change', mileage: 120000 });
    await ledger.append('InspectionRecorded', m, { inspectionId: 'ins-demo-1', vehicleId: 'veh-demo-1', inspectorId: 'SYS', inspectionType: 'GENERAL', findings: [], passed: true, notes: 'Demo inspection', date: now });

    const invoiceId = 'INV-DEMO-1';
    const netAmount = 10000;
    const vatAmount = Math.round(netAmount * 0.16);
    const totalAmount = netAmount + vatAmount;
    await ledger.append('InvoiceGenerated', m, { entityType: 'Invoice', entityId: invoiceId, jobId: 'job-demo-1', customerName: userId, branchId: branch, currency: 'KES', items: [{ description: 'Demo Service', quantity: 1, unitCost: netAmount, total: netAmount }], netAmount, vatAmount, totalAmount, dueDate: now });
    await ledger.append('PaymentRecorded', m, { entityType: 'Payment', entityId: 'PAY-DEMO-1', invoiceId, amount: totalAmount, paymentMethod: 'MPESA', reference: 'SEED', receivedAt: now, branchId: branch });

    reply.code(200).send({ seeded: true, vehicleId: 'veh-demo-1', jobId: 'job-demo-1', invoiceId });
  };
}