import { initializeDb, closeDb } from '../utils/db';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Initialize the SurrealDB schema
 * Reads schema.sql and executes each statement
 */
async function initSchema() {
  console.log('🚀 Starting schema initialization...\n');

  try {
    // Connect to database
    const db = await initializeDb();

    // Read schema file
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Split schema into individual statements
    // Filter out comments and empty lines
    const statements = schemaContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--');
      })
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📋 Found ${statements.length} schema statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementPreview = statement.substring(0, 60) + (statement.length > 60 ? '...' : '');

      try {
        await db.query(statement);
        console.log(`✅ [${i + 1}/${statements.length}] ${statementPreview}`);
        successCount++;
      } catch (error) {
        console.error(`❌ [${i + 1}/${statements.length}] Failed: ${statementPreview}`);
        console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        errorCount++;
      }
    }

    console.log('\n📊 Schema initialization complete:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 All schema statements executed successfully!');
    } else {
      console.log('\n⚠️  Some statements failed. Please review the errors above.');
    }

    // Close connection
    await closeDb();

    // Exit with appropriate code
    process.exit(errorCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Schema initialization failed:', error);
    await closeDb();
    process.exit(1);
  }
}

// Run the script
initSchema();
