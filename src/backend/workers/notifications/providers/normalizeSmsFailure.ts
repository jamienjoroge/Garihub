export function normalizeSmsFailure(input: { httpStatus?: number; message?: string; failureReason?: string }): { failureReason: string; retryable: boolean } {
  if (input.failureReason === 'STUB_FAILURE') return { failureReason: 'STUB_FAILURE', retryable: false };
  if (input.failureReason === 'PROVIDER_EXCEPTION') return { failureReason: 'PROVIDER_EXCEPTION', retryable: true };
  const status = input.httpStatus;
  const msg = (input.message || '').toUpperCase();
  if (status === 429 || msg.includes('THROTTLE')) return { failureReason: 'THROTTLED', retryable: true };
  if (status === 500 || status === 503 || msg.includes('TIMEOUT') || msg.includes('RETRY')) return { failureReason: 'TRANSIENT_PROVIDER_FAILURE', retryable: true };
  if (status === 401 || status === 403 || msg.includes('AUTH')) return { failureReason: 'AUTH_FAILED', retryable: false };
  if (status === 402 || msg.includes('INSUFFICIENT BALANCE')) return { failureReason: 'INSUFFICIENT_BALANCE', retryable: false };
  if (status === 400 || msg.includes('INVALID')) return { failureReason: 'INVALID_RECIPIENT', retryable: false };
  return { failureReason: 'PROVIDER_EXCEPTION', retryable: true };
}