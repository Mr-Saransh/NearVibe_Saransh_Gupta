import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const start = Date.now();
  const res = await p.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    // console.log('Executed query', { text: text.slice(0, 100), duration, rows: res.rowCount });
  }
  return res.rows as T[];
}

export async function testConnection(): Promise<boolean> {
  try {
    const rows = await query<{ now: string }>('SELECT NOW() as now');
    return !!rows[0]?.now;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
}
