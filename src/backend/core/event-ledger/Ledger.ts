import { promises as fs } from 'fs';
import { createHash, randomUUID } from 'crypto';
import path from 'path';
import { EventMetadata } from '../../contracts/common';
import { PostgresEventLedger } from './PostgresLedger';

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  event_name: string;
  metadata: EventMetadata;
  payload: T;
}

export interface LedgerStorageConfig {
  baseDir: string;
}

export class EventLedger {
  private cfg: LedgerStorageConfig;
  private pg?: PostgresEventLedger;

  constructor(cfg?: Partial<LedgerStorageConfig>) {
    const baseDir = cfg?.baseDir ?? path.resolve(process.cwd(), 'data', 'event-ledger');
    this.cfg = { baseDir };
    if (String(process.env.LEDGER_BACKEND || '').toLowerCase() === 'postgres') {
      this.pg = new PostgresEventLedger();
    }
  }

  private fileForTenant(tenant_id: string) {
    return path.join(this.cfg.baseDir, `${tenant_id}.ndjson`);
  }

  async initStorage() {
    if (this.pg) return;
    await fs.mkdir(this.cfg.baseDir, { recursive: true });
  }

  async append<T>(event_name: string, metadata: EventMetadata, payload: T): Promise<DomainEvent<T>> {
    if (this.pg) {
      return await this.pg.append(event_name, metadata, payload);
    }
    const id = randomUUID();
    const enriched = this.enrichPayload(event_name, payload);
    const evt: DomainEvent<T> = { id, event_name, metadata, payload: enriched };
    const line = JSON.stringify(evt) + '\n';
    const file = this.fileForTenant(metadata.tenant_id);
    await this.initStorage();
    await fs.appendFile(file, line, { encoding: 'utf-8' });
    return evt;
  }

  async replay(tenant_id: string, filter?: { branch_id?: string; event_name?: string; correlation_id?: string }): Promise<DomainEvent[]> {
    if (this.pg) {
      return await this.pg.replay(tenant_id, filter);
    }
    const file = this.fileForTenant(tenant_id);
    try {
      const data = await fs.readFile(file, 'utf-8');
      const lines = data.split('\n').filter(Boolean);
      const events = lines.map(l => JSON.parse(l) as DomainEvent);
      return events.filter(e => {
        if (filter?.branch_id && e.metadata.branch_id !== filter.branch_id) return false;
        if (filter?.event_name && e.event_name !== filter.event_name) return false;
        if (filter?.correlation_id && e.metadata.correlation_id !== filter.correlation_id) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  async auditTrail(tenant_id: string, entityKey: { type: string; id: string }): Promise<DomainEvent[]> {
    if (this.pg) {
      return await this.pg.auditTrail(tenant_id, entityKey);
    }
    const events = await this.replay(tenant_id);
    return events.filter(e => {
      const p = e.payload as Record<string, unknown>;
      return p['entityType'] === entityKey.type && p['entityId'] === entityKey.id;
    });
  }

  private enrichPayload<T>(event_name: string, payload: T): T {
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
}