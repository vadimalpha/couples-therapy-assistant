import Surreal from 'surrealdb.js';

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
    await db.signin({ user, pass });
    await db.use({ ns, db: database });
    console.log('SurrealDB connected');
    return db;
  } catch (error) {
    console.error('Failed to connect to SurrealDB:', error);
    throw error;
  }
}

export function getDatabase(): Surreal {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('SurrealDB connection closed');
  }
}
