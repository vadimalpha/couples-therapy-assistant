import Surreal from 'surrealdb';
import * as dotenv from 'dotenv';

dotenv.config();

// Singleton instance
let dbInstance: Surreal | null = null;

interface SurrealConfig {
  url: string;
  username: string;
  password: string;
  namespace: string;
  database: string;
}

/**
 * Get SurrealDB configuration from environment variables
 */
function getConfig(): SurrealConfig {
  const config = {
    url: process.env.SURREAL_URL || '',
    username: process.env.SURREAL_USERNAME || '',
    password: process.env.SURREAL_PASSWORD || '',
    namespace: process.env.SURREAL_NAMESPACE || 'couples_therapy',
    database: process.env.SURREAL_DATABASE || 'main',
  };

  if (!config.url || !config.username || !config.password) {
    throw new Error(
      'Missing required SurrealDB configuration. Please set SURREAL_URL, SURREAL_USERNAME, and SURREAL_PASSWORD in your .env file'
    );
  }

  return config;
}

/**
 * Initialize and connect to SurrealDB Cloud
 * Creates namespace and database if they don't exist
 */
export async function initializeDb(): Promise<Surreal> {
  if (dbInstance) {
    return dbInstance;
  }

  const config = getConfig();

  try {
    const db = new Surreal();

    // Connect to SurrealDB Cloud
    await db.connect(config.url, {
      // WebSocket connection options
      namespace: config.namespace,
      database: config.database,
    });

    // Authenticate
    await db.signin({
      username: config.username,
      password: config.password,
    });

    // Use the namespace and database (creates if not exists)
    await db.use({
      namespace: config.namespace,
      database: config.database,
    });

    dbInstance = db;

    console.log(`✅ Connected to SurrealDB Cloud`);
    console.log(`   Namespace: ${config.namespace}`);
    console.log(`   Database: ${config.database}`);

    return db;
  } catch (error) {
    console.error('❌ Failed to connect to SurrealDB:', error);
    throw error;
  }
}

/**
 * Get the singleton SurrealDB instance
 * Initializes the connection if not already connected
 */
export async function getDb(): Promise<Surreal> {
  if (!dbInstance) {
    return await initializeDb();
  }
  return dbInstance;
}

/**
 * Close the database connection
 * Useful for cleanup in tests or graceful shutdown
 */
export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    console.log('✅ SurrealDB connection closed');
  }
}

/**
 * Check if database is connected
 */
export function isConnected(): boolean {
  return dbInstance !== null;
}
