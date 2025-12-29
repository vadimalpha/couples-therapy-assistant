import { getDatabase } from './db';
import { Conflict, IntakeData } from '../types';
import { generateEmbedding } from './embeddings';

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

export interface RAGContext {
  recentConflicts: Conflict[];
  intakeData: IntakeData | null;
  relationshipHistory: string;
}

/**
 * Get similar conflicts using vector similarity search
 * Uses SurrealDB's vector::similarity::cosine for efficient similarity search
 * Excludes the current conflict and filters by relationship_id
 */
export async function getSimilarConflicts(
  conflictId: string,
  limit: number = 5
): Promise<Conflict[]> {
  const db = getDatabase();

  try {
    // First, get the current conflict to get its relationship_id and generate query embedding
    const fullConflictId = conflictId.startsWith('conflict:')
      ? conflictId
      : `conflict:${conflictId}`;

    const conflictResult = await db.query(
      'SELECT * FROM $conflictId',
      { conflictId: fullConflictId }
    );

    const conflicts = extractQueryResult<Conflict>(conflictResult);
    if (conflicts.length === 0) {
      throw new Error('Conflict not found');
    }

    const currentConflict = conflicts[0];
    const relationshipId = currentConflict.relationship_id;

    // Get the embedding for this conflict
    const embeddingResult = await db.query(
      `SELECT embedding FROM embedding WHERE metadata.type = 'conflict' AND metadata.sourceId = $conflictId`,
      { conflictId: fullConflictId }
    );

    const embeddings = extractQueryResult<{ embedding: number[] }>(embeddingResult);
    if (embeddings.length === 0) {
      // No embedding found, return empty array
      console.warn(`No embedding found for conflict ${conflictId}`);
      return [];
    }

    const queryEmbedding = embeddings[0].embedding;

    // Use SurrealDB's vector similarity to find similar conflicts
    // Join with conflict table to get full conflict details and filter by relationship
    const similarConflictsResult = await db.query(
      `SELECT
        conflict.* AS conflict,
        vector::similarity::cosine(embedding.embedding, $queryEmbedding) AS similarity
      FROM embedding
      INNER JOIN conflict ON embedding.metadata.sourceId = conflict.id
      WHERE embedding.metadata.type = 'conflict'
        AND conflict.relationship_id = $relationshipId
        AND conflict.id != $conflictId
      ORDER BY similarity DESC
      LIMIT $limit`,
      {
        queryEmbedding,
        relationshipId,
        conflictId: fullConflictId,
        limit,
      }
    );

    const results = extractQueryResult<{ conflict: Conflict; similarity: number }>(similarConflictsResult);
    if (results.length === 0) {
      return [];
    }

    return results
      .filter((item: any) => item.similarity > 0)
      .map((item: any) => item.conflict);
  } catch (error) {
    console.error('Error fetching similar conflicts:', error);
    // Fall back to recent conflicts if vector search fails
    return getRecentConflicts(conflictId, limit);
  }
}

/**
 * Fallback: Get recent conflicts when vector search is unavailable
 */
async function getRecentConflicts(
  conflictId: string,
  limit: number = 5
): Promise<Conflict[]> {
  const db = getDatabase();

  try {
    const fullConflictId = conflictId.startsWith('conflict:')
      ? conflictId
      : `conflict:${conflictId}`;

    const conflictResult = await db.query(
      'SELECT relationship_id FROM $conflictId',
      { conflictId: fullConflictId }
    );

    const conflictData = extractQueryResult<{ relationship_id: string }>(conflictResult);
    if (conflictData.length === 0) {
      return [];
    }

    const relationshipId = conflictData[0].relationship_id;

    const recentResult = await db.query(
      `SELECT * FROM conflict
       WHERE relationship_id = $relationshipId AND id != $conflictId
       ORDER BY created_at DESC
       LIMIT $limit`,
      { relationshipId, conflictId: fullConflictId, limit }
    );

    return extractQueryResult<Conflict>(recentResult);
  } catch (error) {
    console.error('Error fetching recent conflicts:', error);
    return [];
  }
}

/**
 * Get full RAG context for a conflict
 * Includes similar conflicts, intake data, and relationship history
 */
export async function getRAGContext(
  conflictId: string,
  userId: string
): Promise<RAGContext> {
  const db = getDatabase();

  try {
    // Get similar conflicts
    const recentConflicts = await getSimilarConflicts(conflictId, 5);

    // Get user's intake data
    let intakeData: IntakeData | null = null;
    const userResult = await db.query(
      'SELECT intakeData FROM user WHERE id = $userId',
      { userId }
    );

    const users = extractQueryResult<{ intakeData?: IntakeData }>(userResult);
    if (users.length > 0 && users[0].intakeData) {
      intakeData = users[0].intakeData;
    }

    // Build relationship history from conflicts
    let relationshipHistory = '';
    if (recentConflicts.length > 0) {
      relationshipHistory = `Previous conflicts:\n${recentConflicts
        .map((c, idx) => `${idx + 1}. ${c.title} (${new Date(c.created_at).toLocaleDateString()})`)
        .join('\n')}`;
    } else {
      relationshipHistory = 'No previous conflicts recorded.';
    }

    return {
      recentConflicts,
      intakeData,
      relationshipHistory,
    };
  } catch (error) {
    console.error('Error building RAG context:', error);
    return {
      recentConflicts: [],
      intakeData: null,
      relationshipHistory: 'Error loading relationship history.',
    };
  }
}

/**
 * Build context string for prompt injection
 * Formats RAG context into a string suitable for Claude prompts
 */
export function buildContextString(context: RAGContext): string {
  const sections: string[] = [];

  // Add intake data if available
  if (context.intakeData) {
    sections.push('## Relationship Background');
    sections.push(`- Relationship duration: ${context.intakeData.relationship_duration}`);
    sections.push(`- Living situation: ${context.intakeData.living_situation}`);
    sections.push(`- Communication style: ${context.intakeData.communication_style_summary}`);

    if (context.intakeData.conflict_triggers && context.intakeData.conflict_triggers.length > 0) {
      sections.push(`- Conflict triggers: ${context.intakeData.conflict_triggers.join(', ')}`);
    }

    if (context.intakeData.previous_patterns) {
      sections.push(`- Previous patterns: ${context.intakeData.previous_patterns}`);
    }

    if (context.intakeData.relationship_goals && context.intakeData.relationship_goals.length > 0) {
      sections.push(`- Relationship goals: ${context.intakeData.relationship_goals.join(', ')}`);
    }
  }

  // Add relationship history
  if (context.relationshipHistory) {
    sections.push('');
    sections.push('## Relationship History');
    sections.push(context.relationshipHistory);
  }

  // Add similar conflicts details if available
  if (context.recentConflicts.length > 0) {
    sections.push('');
    sections.push('## Similar Past Conflicts');
    context.recentConflicts.forEach((conflict, idx) => {
      sections.push(`### ${idx + 1}. ${conflict.title}`);
      sections.push(`Status: ${conflict.status}`);
      sections.push(`Date: ${new Date(conflict.created_at).toLocaleDateString()}`);
      if (conflict.privacy === 'shared') {
        sections.push('Privacy: Shared between partners');
      }
    });
  }

  return sections.join('\n');
}
