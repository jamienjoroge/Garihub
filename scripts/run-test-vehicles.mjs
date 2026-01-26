import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('ts-node/esm', pathToFileURL('./'));
await import('../src/backend/http/__tests__/vehicles.int.test.ts');