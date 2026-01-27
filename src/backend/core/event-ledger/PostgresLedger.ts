import { randomUUID, createHash } from 'crypto';
import { EventMetadata } from '../../contracts/common';
import { query } from '../../db/pg.ts';

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  event_name: string;
  metadata: EventMetadata;
  payload: T;
}

function enrichPayload<T>(event_name: string, payload: T): T {
  if (event_name === 'ServiceRecordMinted') {
    const p = payload as unknown as Record<string, unknown>;
    const vehicleId = String(p['vehicleId'] ?? '');
    const prevHash = String(p['previousHash'] ?? '');
    const toHash = JSON.stringify({ event_name, vehicleId, prevHash, payload });
    const hash = createHash('sha256').update(toHash).digest('hex');
    (p as Record<string, unknown>)['hash'] = hash;
    return p as unknown as T;
  }
  return payload;
}

export class PostgresEventLedger {
  constructor() {}

  async append<T>(event_name: string, metadata: EventMetadata, payload: T): Promise<DomainEvent<T>> {
    const id = randomUUID();
    const enriched = enrichPayload(event_name, payload);
    const occurred_at = new Date(metadata.timestamp || new Date().toISOString());
    const prev_hash = (enriched as any)?.previousHash || null;
    const hash = (enriched as any)?.hash || null;
    await query(
      `INSERT INTO event_ledger (id, tenant_id, occurred_at, correlation_id, event_name, payload, metadata, hash, prev_hash)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)`,
      [id, metadata.tenant_id, occurred_at, metadata.correlation_id || null, event_name, JSON.stringify(enriched), JSON.stringify(metadata), hash, prev_hash]
    );
    const evt: DomainEvent<T> = { id, event_name, metadata, payload: enriched };
    return evt;
  }

  async replay(tenant_id: string, filter?: { branch_id?: string; event_name?: string; correlation_id?: string; from?: string; to?: string }): Promise<DomainEvent[]> {
    const params: any[] = [tenant_id];
    const where: string[] = ['tenant_id = $1'];
    if (filter?.event_name) { params.push(filter.event_name); where.push(`event_name = $${params.length}`); }
    if (filter?.correlation_id) { params.push(filter.correlation_id); where.push(`correlation_id = $${params.length}`); }
    if (filter?.from) { params.push(new Date(filter.from)); where.push(`occurred_at >= $${params.length}`); }
    if (filter?.to) { params.push(new Date(filter.to)); where.push(`occurred_at <= $${params.length}`); }
    // branch_id filter is in metadata
    if (filter?.branch_id) { params.push(filter.branch_id); where.push(`metadata->>'branch_id' = $${params.length}`); }
    const sql = `SELECT id, event_name, metadata, payload FROM event_ledger WHERE ${where.join(' AND ')} ORDER BY seq ASC`;
    const res = await query(sql, params);
    return (res.rows || []).map(r => ({ id: String((r as any).id), event_name: String((r as any).event_name), metadata: (r as any).metadata, payload: (r as any).payload }));
  }

  async auditTrail(tenant_id: string, entityKey: { type: string; id: string }): Promise<DomainEvent[]> {
    const res = await query(
      `SELECT id, event_name, metadata, payload FROM event_ledger WHERE tenant_id = $1 AND payload->>'entityType' = $2 AND payload->>'entityId' = $3 ORDER BY seq ASC`,
      [tenant_id, entityKey.type, entityKey.id]
    );
    return (res.rows || []).map(r => ({ id: String((r as any).id), event_name: String((r as any).event_name), metadata: (r as any).metadata, payload: (r as any).payload }));
  }
}