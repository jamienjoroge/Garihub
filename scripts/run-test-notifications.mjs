import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('ts-node/esm', pathToFileURL('./'));
await import('../src/backend/workers/notifications/__tests__/worker.test.ts');