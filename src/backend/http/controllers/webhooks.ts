import { FastifyRequest, FastifyReply } from 'fastify';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { ReceiptService } from '../../modules/notifications/write/receiptService';

export function createSmsReceiptWebhookController(ledger: EventLedger) {
  const service = new ReceiptService(ledger);
  return async function handler(req: FastifyRequest, reply: FastifyReply) {
    const secret = String((req.headers as any)['x-webhook-secret'] || '');
    if (secret !== String(process.env.WEBHOOK_SECRET || '')) {
      reply.code(403).send({ errorCode: 'AUTHORIZATION_ERROR', message: 'Invalid webhook secret', correlation_id: String((req.headers as any)['x-correlation-id'] || '') });
      return;
    }
    const tenant_id = String((req.headers as any)['x-tenant-id'] || '');
    const metadata = {
      tenant_id,
      branch_id: String((req.headers as any)['x-branch-id'] || ''),
      user_id: 'webhook',
      timestamp: new Date().toISOString(),
      correlation_id: String((req.headers as any)['x-correlation-id'] || ''),
    };
    const payload = (req.body || {}) as any;
    await service.recordReceipt(payload, metadata);
    reply.code(200).send({ ok: true });
  };
}