import { EventLedger } from '../../core/event-ledger/Ledger';

export async function resolveNotificationByToken(ledger: EventLedger, tenant_id: string, tokenId: string) {
  const evts = await ledger.replay(tenant_id);
  const evt = evts.find(e => e.event_name === 'NotificationProofAccessGranted' && String((e.payload as any).tokenId) === tokenId) as any;
  if (!evt) return null;
  return { notificationId: evt.payload.notificationId as string, expiresAt: evt.payload.expiresAt as string };
}

export async function validateNotificationToken(ledger: EventLedger, tenant_id: string, tokenId: string, notificationId: string) {
  const res = await resolveNotificationByToken(ledger, tenant_id, tokenId);
  if (!res) return { valid: false, reason: 'NOT_FOUND' };
  if (res.notificationId !== notificationId) return { valid: false, reason: 'MISMATCH' };
  const now = new Date().toISOString();
  if (String(res.expiresAt) < now) return { valid: false, reason: 'EXPIRED' };
  return { valid: true };
}