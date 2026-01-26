import { FastifyRequest, FastifyReply } from 'fastify';
import { buildMetadata } from '../metadata';
import { InventoryService } from '../../modules/inventory/write/services';

export function createIssueStockController(inventoryService: InventoryService) {
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const metadata = buildMetadata(req);
    const body = (req.body || {}) as any;
    const cmd = {
      command_name: 'IssueStock',
      metadata,
      payload: {
        issueId: body.issueId,
        jobId: body.jobId,
        productId: body.productId,
        quantity: body.quantity,
        unitCost: body.unitCost,
        branchId: body.branchId,
      },
    } as any;
    const result = await inventoryService.issueStock(cmd);
    reply.code(201).send(result.stockEvt);
  };
}