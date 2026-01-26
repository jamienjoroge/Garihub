import { EventLedger } from '../../core/event-ledger/Ledger';
import path from 'path';
import { promises as fs } from 'fs';
import { resolveVehicleByToken, validateToken } from '../read/access';

async function setupBaseDir(name: string) {
  const baseDir = path.resolve(process.cwd(), 'data-test', name);
  await fs.rm(baseDir, { recursive: true, force: true });
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

async function run() {
  const baseDir = await setupBaseDir('access-read');
  const ledger = new EventLedger({ baseDir });
  const m = { tenant_id: 't1', branch_id: 'b1', user_id: 'u', correlation_id: 'c', timestamp: '2026-01-10T00:00:00Z' };
  await ledger.append('VehicleHistoryAccessGranted', m, { vehicleId: 'veh-1', tokenId: 'tok-1', expiresAt: '2026-12-31T23:59:59Z', issuedBy: 'u', reason: 'resale' });
  const res = await resolveVehicleByToken(ledger, 't1', 'tok-1');
  if (!res || res.vehicleId !== 'veh-1') throw new Error('Resolve by token failed');
  const valid = await validateToken(ledger, 't1', 'tok-1', 'veh-1');
  if (!valid.valid) throw new Error('Valid token check failed');
  const invalid = await validateToken(ledger, 't1', 'tok-1', 'veh-2');
  if (invalid.valid) throw new Error('Token should not grant other vehicles');
  // eslint-disable-next-line no-console
  console.log('Access read tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });