import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

export type { PoolClient } from "pg";

let pool: Pool | undefined;

export function getPool() {
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("PostgreSQL is not configured. Set DATABASE_URL or DATABASE_URL_POOLED in .env.local.");
  pool ??= new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000, ssl: { rejectUnauthorized: true } });
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}


export async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL);
}
