let pool: any = null;

async function getPool(): Promise<any> {
  if (pool) return pool;
  const url = process.env.DATABASE_URL || '';
  if (!url) throw new Error('DATABASE_URL env not set');
  const pg = await import('pg');
  const { Pool } = pg as any;
  pool = new Pool({ connectionString: url });
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }> {
  const p = await getPool();
  const client = await p.connect();
  try {
    const res = await client.query(sql, params || []);
    return { rows: res.rows as T[] };
  } finally {
    client.release();
  }
}