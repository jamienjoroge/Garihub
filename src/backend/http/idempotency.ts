export interface CachedResponse {
  status: number;
  payload: any;
}

const cache = new Map<string, CachedResponse>();

export function buildKey(headers: Record<string, any>): string {
  const tenant = String(headers['x-tenant-id'] || '');
  const correlation = String(headers['x-correlation-id'] || '');
  return `${tenant}:${correlation}`;
}

export function checkAndReturn(key: string): CachedResponse | null {
  return cache.get(key) ?? null;
}

export function store(key: string, response: CachedResponse): void {
  if (!cache.has(key)) cache.set(key, response);
}