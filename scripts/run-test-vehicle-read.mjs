import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('ts-node/esm', pathToFileURL('./'));
await import('../src/backend/modules/customer-vehicles/__tests__/vehicle.read.test.ts');