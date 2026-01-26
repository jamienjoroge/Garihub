import { createHmac } from 'crypto';

export function signToken(payload: Record<string, any>, secret?: string): string {
  const s = secret || process.env.AUTH_SECRET || 'dev-secret';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = createHmac('sha256', s).update(data).digest('hex');
  return `${data}.${sig}`;
}