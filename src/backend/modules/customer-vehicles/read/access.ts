import { EventLedger } from '../../../core/event-ledger/Ledger';

export async function resolveVehicleByToken(ledger: EventLedger, tenant_id: string, tokenId: string) {
  const evts = await ledger.replay(tenant_id, { event_name: 'VehicleHistoryAccessGranted' });
  const evt = (evts as any[]).find(e => e.payload.tokenId === tokenId);
  if (!evt) return null;
  return { vehicleId: evt.payload.vehicleId, expiresAt: evt.payload.expiresAt };
}

export async function validateToken(ledger: EventLedger, tenant_id: string, tokenId: string, vehicleId: string) {
  const res = await resolveVehicleByToken(ledger, tenant_id, tokenId);
  if (!res) return { valid: false, reason: 'NOT_FOUND' };
  if (res.vehicleId !== vehicleId) return { valid: false, reason: 'MISMATCH' };
  const now = new Date().toISOString();
  if (String(res.expiresAt) < now) return { valid: false, reason: 'EXPIRED' };
  return { valid: true };
}