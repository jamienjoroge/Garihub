import { normalizeSmsFailure } from '../providers/normalizeSmsFailure';

function assert(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

async function run() {
  let r = normalizeSmsFailure({ httpStatus: 429 });
  assert(r.failureReason === 'THROTTLED' && r.retryable === true, '429 → THROTTLED retryable');
  r = normalizeSmsFailure({ httpStatus: 500 });
  assert(r.failureReason === 'TRANSIENT_PROVIDER_FAILURE' && r.retryable === true, '500 → TRANSIENT retryable');
  r = normalizeSmsFailure({ httpStatus: 401 });
  assert(r.failureReason === 'AUTH_FAILED' && r.retryable === false, '401 → AUTH_FAILED non-retry');
  r = normalizeSmsFailure({ message: 'Insufficient balance' });
  assert(r.failureReason === 'INSUFFICIENT_BALANCE' && r.retryable === false, 'balance → non-retry');
  r = normalizeSmsFailure({ message: 'invalid recipient' });
  assert(r.failureReason === 'INVALID_RECIPIENT' && r.retryable === false, 'invalid → non-retry');
  r = normalizeSmsFailure({ failureReason: 'PROVIDER_EXCEPTION' });
  assert(r.failureReason === 'PROVIDER_EXCEPTION' && r.retryable === true, 'exception → retry');
  r = normalizeSmsFailure({ failureReason: 'STUB_FAILURE' });
  assert(r.failureReason === 'STUB_FAILURE' && r.retryable === false, 'stub → non-retry');
  // eslint-disable-next-line no-console
  console.log('normalizeSmsFailure tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });