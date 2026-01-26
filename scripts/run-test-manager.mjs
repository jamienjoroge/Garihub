import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('ts-node/esm', pathToFileURL('./'));
await import('../src/backend/modules/reporting-read-models/__tests__/manager.read.test.ts');