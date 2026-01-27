import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err?.stack || err);
  process.exitCode = 1;
});
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err?.stack || err);
  process.exitCode = 1;
});

register('ts-node/esm', pathToFileURL('./'));

try {
  await import('../src/backend/http/start.ts');
} catch (err) {
  console.error('bootstrap import failed', err?.stack || err);
  process.exit(1);
}