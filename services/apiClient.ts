import { randomUUID } from 'crypto';

type Method = 'GET' | 'POST';

const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';

async function request(path: string, method: Method, body?: any) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': (import.meta as any).env?.VITE_TENANT_ID || 't1',
    'x-branch-id': (import.meta as any).env?.VITE_BRANCH_ID || 'b1',
    'x-user-id': (import.meta as any).env?.VITE_USER_ID || 'u1',
    'x-correlation-id': randomUUID(),
  };
  const token = localStorage.getItem('authToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    const err = json && typeof json === 'object' ? json : { errorCode: 'UNKNOWN_ERROR', message: String(text || 'Error'), correlation_id: headers['x-correlation-id'] };
    throw err;
  }
  return json;
}

export const apiClient = {
  get: (path: string) => request(path, 'GET'),
  post: (path: string, body: any) => request(path, 'POST', body),
};