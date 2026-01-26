CREATE TABLE IF NOT EXISTS event_ledger (
  id UUID NOT NULL,
  seq BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  correlation_id TEXT,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL,
  hash TEXT,
  prev_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_event_ledger_tenant_seq ON event_ledger (tenant_id, seq);
CREATE INDEX IF NOT EXISTS idx_event_ledger_tenant_occurred ON event_ledger (tenant_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_ledger_tenant_corr ON event_ledger (tenant_id, correlation_id);