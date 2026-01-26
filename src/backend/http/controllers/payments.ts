import { FastifyRequest, FastifyReply } from 'fastify';
import { buildMetadata } from '../metadata';
import { FinanceService } from '../../modules/finance-accounting/write/services';

export function createPaymentController(financeService: FinanceService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'RecordPayment',
      metadata,
      payload: {
        paymentId: body.paymentId,
        invoiceId: body.invoiceId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        reference: body.reference,
        receivedAt: body.receivedAt,
        branchId: body.branchId,
      },
    } as any;
    const result = await financeService.recordPayment(cmd);
    reply.code(201).send(result.payEvt);
  };
}