import { FastifyRequest, FastifyReply } from 'fastify';
import { buildMetadata } from '../metadata';
import { FinanceService } from '../../modules/finance-accounting/write/services';

export function createInvoiceController(financeService: FinanceService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'GenerateInvoice',
      metadata,
      payload: {
        invoiceId: body.invoiceId,
        jobId: body.jobId,
        customerName: body.customerName,
        branchId: body.branchId,
        currency: body.currency,
        items: body.items,
        netAmount: body.netAmount,
        dueDate: body.dueDate,
      },
    } as any;
    const result = await financeService.generateInvoice(cmd);
    reply.code(201).send(result.invoiceEvt);
  };
}