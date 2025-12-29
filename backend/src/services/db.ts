import Surreal from 'surrealdb.js';
import { readFileSync } from 'fs';
import { join } from 'path';

let db: Surreal | null = null;

export async function initializeDatabase(): Promise<Surreal> {
  if (db) {
    return db;
  }

  const url = process.env.SURREALDB_URL;
  const user = process.env.SURREALDB_USER;
  const pass = process.env.SURREALDB_PASS;
  const ns = process.env.SURREALDB_NS;
  const database = process.env.SURREALDB_DB;

  if (!url || !user || !pass || !ns || !database) {
    throw new Error('Missing SurrealDB configuration. Check environment variables.');
  }

  db = new Surreal();

  try {
    await db.connect(url);
    // Use namespace-level authentication
    await db.signin({ namespace: ns, username: user, password: pass });
    await db.use({ namespace: ns, database });
    console.log('SurrealDB connected');

    // Initialize schema if needed
    await initializeSchema();

    return db;
  } catch (error) {
    console.error('Failed to connect to SurrealDB:', error);
    throw error;
  }
}

/**
 * Initialize database schema
 * Applies schema definitions from schema.surql file
 */
async function initializeSchema(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const schemaPath = join(__dirname, '..', 'db', 'schema.surql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema statements
    await db.query(schema);
    console.log('Database schema initialized');
  } catch (error) {
    // Log but don't fail - schema might already exist
    console.warn('Schema initialization warning:', error);
  }
}

export function getDatabase(): Surreal {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Type-safe query helper that extracts first result set
 * Use for queries that return a single array of items
 */
export async function queryFirst<T>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
  const result = await getDatabase().query(sql, params);
  if (Array.isArray(result) && result.length > 0) {
    return result[0] as T[];
  }
  return [];
}

/**
 * Type-safe query helper that extracts a single item from first result set
 * Use for queries that return exactly one item
 */
export async function queryOne<T>(sql: string, params?: Record<string, unknown>): Promise<T | undefined> {
  const items = await queryFirst<T>(sql, params);
  return items[0];
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('SurrealDB connection closed');
  }
}
