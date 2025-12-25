import { getDatabase } from './db';
import { Conflict, IntakeData } from '../types';
import { generateEmbedding, cosineSimilarity } from './embeddings';

// Make cosineSimilarity available - it's currently not exported
// We'll use SurrealDB's vector functions instead
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

export interface RAGContext {
  recentConflicts: Conflict[];
  intakeData: IntakeData | null;
  relationshipHistory: string;
}

/**
 * Get similar conflicts using vector similarity search
 * Excludes the current conflict and filters by relationship_id
 */
export async function getSimilarConflicts(
  conflictId: string,
  limit: number = 5
): Promise<Conflict[]> {
  const db = getDatabase();

  try {
    // First, get the current conflict to get its relationship_id and embedding
    const fullConflictId = conflictId.startsWith('conflict:')
      ? conflictId
      : `conflict:${conflictId}`;

    const conflictResult = await db.query(
      'SELECT * FROM $conflictId',
      { conflictId: fullConflictId }
    );

    if (
      !conflictResult ||
      conflictResult.length === 0 ||
      !(conflictResult[0] as any).result ||
      (conflictResult[0] as any).result.length === 0
    ) {
      throw new Error('Conflict not found');
    }

    const currentConflict = (conflictResult[0] as any).result[0];
    const relationshipId = currentConflict.relationship_id;

    // Get the embedding for this conflict
    const embeddingResult = await db.query(
      `SELECT embedding FROM embedding WHERE metadata.type = 'conflict' AND metadata.sourceId = $conflictId`,
      { conflictId: fullConflictId }
    );

    if (
      !embeddingResult ||
      embeddingResult.length === 0 ||
      !(embeddingResult[0] as any).result ||
      (embeddingResult[0] as any).result.length === 0
    ) {
      // No embedding found, return empty array
      console.warn(`No embedding found for conflict ${conflictId}`);
      return [];
    }

    const queryEmbedding = (embeddingResult[0] as any).result[0].embedding;

    // Get all conflicts from the same relationship (excluding current)
    const allConflictsResult = await db.query(
      `SELECT * FROM conflict WHERE relationship_id = $relationshipId AND id != $conflictId ORDER BY created_at DESC`,
      {
        relationshipId,
        conflictId: fullConflictId,
      }
    );

    if (
      !allConflictsResult ||
      allConflictsResult.length === 0 ||
      !(allConflictsResult[0] as any).result
    ) {
      return [];
    }

    const allConflicts = (allConflictsResult[0] as any).result || [];

    // For each conflict, get its embedding and calculate similarity
    const conflictsWithSimilarity = await Promise.all(
      allConflicts.map(async (conflict: Conflict) => {
        const embResult = await db.query(
          `SELECT embedding FROM embedding WHERE metadata.type = 'conflict' AND metadata.sourceId = $conflictId`,
          { conflictId: conflict.id }
        );

        let similarity = 0;
        if (
          embResult &&
          embResult.length > 0 &&
          (embResult[0] as any).result &&
          (embResult[0] as any).result.length > 0
        ) {
          const conflictEmbedding = (embResult[0] as any).result[0].embedding;
          similarity = calculateCosineSimilarity(queryEmbedding, conflictEmbedding);
        }

        return {
          conflict,
          similarity,
        };
      })
    );

    // Sort by similarity (highest first) and take top N
    return conflictsWithSimilarity
      .filter(item => item.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.conflict);
  } catch (error) {
    console.error('Error fetching similar conflicts:', error);
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

    if (
      userResult &&
      userResult.length > 0 &&
      (userResult[0] as any).result &&
      (userResult[0] as any).result.length > 0
    ) {
      const userData = (userResult[0] as any).result[0];
      intakeData = userData.intakeData || null;
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
