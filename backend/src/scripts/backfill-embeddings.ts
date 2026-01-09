/**
 * Backfill Embeddings Script
 *
 * Generates embeddings for existing users who have intake data
 * but don't have embeddings stored yet.
 *
 * Usage: npx ts-node src/scripts/backfill-embeddings.ts
 */

import { config } from 'dotenv';
config();

import { getDatabase, initializeDatabase, closeDatabase } from '../services/db';
import { embedIntakeData, embedAndStore } from '../services/embeddings';
import { IntakeData } from '../types';

interface UserWithIntake {
  id: string;
  firebaseUid: string;
  email: string;
  intakeData?: IntakeData;
}

interface ConversationWithMessages {
  id: string;
  userId: string;
  sessionType: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;
}

/**
 * Helper to extract results from SurrealDB query response
 */
function extractQueryResult<T>(result: unknown): T[] {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return [];
  }
  if (result[0] && typeof result[0] === 'object' && 'result' in result[0]) {
    return (result[0] as { result: T[] }).result || [];
  }
  if (Array.isArray(result[0])) {
    return result[0] as T[];
  }
  if (result[0] && typeof result[0] === 'object') {
    return [result[0] as T];
  }
  return [];
}

async function backfillIntakeEmbeddings(): Promise<number> {
  const db = getDatabase();
  console.log('Starting intake embeddings backfill...');

  // Get all users with intake data
  const usersResult = await db.query(
    'SELECT id, firebaseUid, email, intakeData FROM user WHERE intakeData != NONE'
  );
  const users = extractQueryResult<UserWithIntake>(usersResult);

  console.log(`Found ${users.length} users with intake data`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    if (!user.intakeData) continue;

    try {
      console.log(`Processing user: ${user.email || user.id}`);

      // Use firebaseUid to match how searchSimilar queries (via context.userId from routes)
      await embedIntakeData(user.firebaseUid, {
        name: user.intakeData.name,
        relationship_duration: user.intakeData.relationship_duration,
        communication_style_summary: user.intakeData.communication_style_summary,
        conflict_triggers: user.intakeData.conflict_triggers,
        previous_patterns: user.intakeData.previous_patterns,
        relationship_goals: user.intakeData.relationship_goals,
      });

      successCount++;
      console.log(`  ✓ Generated intake embedding for ${user.email || user.id}`);
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Failed for ${user.email || user.id}:`, error);
    }
  }

  console.log(`\nIntake embeddings complete: ${successCount} success, ${errorCount} errors`);
  return successCount;
}

async function backfillConversationEmbeddings(): Promise<number> {
  const db = getDatabase();
  console.log('\nStarting conversation embeddings backfill...');

  // Get all conversation sessions with messages
  const sessionsResult = await db.query(
    'SELECT id, userId, sessionType, messages FROM conversation WHERE messages != NONE AND array::len(messages) > 0'
  );
  const sessions = extractQueryResult<ConversationWithMessages>(sessionsResult);

  console.log(`Found ${sessions.length} conversations with messages`);

  let messageCount = 0;
  let errorCount = 0;

  for (const session of sessions) {
    if (!session.messages || session.messages.length === 0) continue;

    // Only embed user messages that are substantial
    const userMessages = session.messages.filter(
      m => m.role === 'user' && m.content.length > 30
    );

    for (const msg of userMessages) {
      try {
        await embedAndStore(msg.content, {
          type: 'conversation',
          referenceId: `${session.id}:${msg.id}`,
          userId: session.userId,
        });
        messageCount++;
      } catch (error) {
        errorCount++;
        // Don't log every error, just count them
      }
    }

    console.log(`  Processed ${userMessages.length} messages from session ${session.id}`);
  }

  console.log(`\nConversation embeddings complete: ${messageCount} messages, ${errorCount} errors`);
  return messageCount;
}

async function main() {
  console.log('=== Embeddings Backfill Script ===\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY not set');
    process.exit(1);
  }

  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database connected\n');

    // Run backfills
    const intakeCount = await backfillIntakeEmbeddings();
    const messageCount = await backfillConversationEmbeddings();

    console.log('\n=== Summary ===');
    console.log(`Intake embeddings generated: ${intakeCount}`);
    console.log(`Message embeddings generated: ${messageCount}`);

  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
    console.log('\nDatabase connection closed');
  }
}

main();
