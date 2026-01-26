import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('ts-node/esm', pathToFileURL('./'));
import { EventLedger } from '../../core/event-ledger/Ledger.ts';
import { runNotificationsWorker } from './worker.ts';
import { SmsProvider } from './providers/SmsProvider.ts';

const tenant = process.env.TENANT_ID || 't1';
const baseDir = process.env.LEDGER_DIR;
const ledger = new EventLedger(baseDir ? { baseDir } : {});
const providerName = process.env.NOTIFICATION_PROVIDER;
let provider;
if (providerName === 'sms') {
  provider = new SmsProvider();
}
await runNotificationsWorker(ledger, tenant, provider);