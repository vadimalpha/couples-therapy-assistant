import openai from './openai-client';
import { getDatabase } from './db';

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

export interface EmbeddingDocument {
  id: string;
  userId: string;
  content: string;
  embedding: number[];
  metadata: {
    type: 'intake' | 'conflict' | 'conversation';
    sourceId: string;
    createdAt: string;
  };
  [key: string]: unknown;
}

/**
 * Generate text embedding using OpenAI's text-embedding-3-small model
 * Falls back to pseudo-embedding if OpenAI is not available
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set - using fallback pseudo-embeddings');
    return generatePseudoEmbedding(text);
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('OpenAI embedding generation failed, falling back to pseudo-embedding:', error);
    return generatePseudoEmbedding(text);
  }
}

/**
 * Generate pseudo-embedding for testing/fallback
 * Produces 1536-dimensional embeddings to match text-embedding-3-small
 */
function generatePseudoEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().trim();
  const embedding = new Array(1536).fill(0);

  for (let i = 0; i < normalized.length && i < 200; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = (charCode * (i + 1)) % 1536;
    embedding[idx] += 1 / (i + 1);
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

/**
 * Generate and store embeddings for intake data
 */
export async function embedIntakeData(
  userId: string,
  intakeData: {
    name?: string;
    relationship_duration?: string;
    communication_style_summary?: string;
    conflict_triggers?: string[];
    previous_patterns?: string;
    relationship_goals?: string[];
  }
): Promise<void> {
  const db = getDatabase();

  // Combine intake data into searchable text
  const textParts = [
    intakeData.name || '',
    `Relationship duration: ${intakeData.relationship_duration || 'unknown'}`,
    `Communication style: ${intakeData.communication_style_summary || ''}`,
    `Conflict triggers: ${(intakeData.conflict_triggers || []).join(', ')}`,
    `Previous patterns: ${intakeData.previous_patterns || ''}`,
    `Relationship goals: ${(intakeData.relationship_goals || []).join(', ')}`,
  ];

  const content = textParts.filter(part => part.trim()).join('\n');
  const embedding = await generateEmbedding(content);

  try {
    // Store embedding in database
    await db.query(
      `CREATE embedding CONTENT {
        userId: $userId,
        content: $content,
        embedding: $embedding,
        metadata: {
          type: 'intake',
          sourceId: $userId,
          createdAt: $createdAt
        }
      }`,
      {
        userId,
        content,
        embedding,
        createdAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }
}

/**
 * Search for similar content using vector similarity
 * This is a simple implementation - in production, use a proper vector database
 */
export async function searchSimilar(
  userId: string,
  queryText: string,
  limit: number = 5
): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
  const db = getDatabase();

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(queryText);

    // Fetch all user's embeddings
    const result = await db.query(
      'SELECT * FROM embedding WHERE userId = $userId',
      { userId }
    );

    const documents = extractQueryResult<EmbeddingDocument>(result);
    if (documents.length === 0) {
      return [];
    }

    // Calculate cosine similarity for each document
    const similarities = documents.map(doc => {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
      return {
        content: doc.content,
        similarity,
        metadata: doc.metadata,
      };
    });

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('Error searching similar content:', error);
    throw error;
  }
}

/**
 * Store text with embedding in vector database
 * Generic function for storing any type of embedded content
 */
export async function embedAndStore(
  text: string,
  metadata: {
    type: 'intake' | 'conversation' | 'conflict';
    referenceId: string;
    userId: string;
  }
): Promise<void> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }

  const db = getDatabase();
  const embedding = await generateEmbedding(text);

  try {
    await db.query(
      `CREATE embedding CONTENT {
        userId: $userId,
        content: $content,
        embedding: $embedding,
        metadata: {
          type: $type,
          sourceId: $sourceId,
          createdAt: $createdAt
        }
      }`,
      {
        userId: metadata.userId,
        content: text.trim(),
        embedding,
        type: metadata.type,
        sourceId: metadata.referenceId,
        createdAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }
}

/**
 * Find similar context using vector similarity search
 * Uses SurrealDB's built-in vector::similarity::cosine function
 */
export async function findSimilarContext(
  queryText: string,
  type?: string,
  limit: number = 5
): Promise<Array<{ text: string; score: number; metadata: any }>> {
  if (!queryText || queryText.trim().length === 0) {
    throw new Error('Cannot search with empty query');
  }

  const db = getDatabase();
  const queryEmbedding = await generateEmbedding(queryText);

  try {
    // Build query with optional type filter
    const typeFilter = type ? `AND metadata.type = $type` : '';

    const result = await db.query(
      `SELECT
        content,
        metadata,
        vector::similarity::cosine(embedding, $queryEmbedding) AS score
      FROM embedding
      WHERE 1=1 ${typeFilter}
      ORDER BY score DESC
      LIMIT $limit`,
      {
        queryEmbedding,
        type,
        limit,
      }
    );

    const items = extractQueryResult<{ content: string; score: number; metadata: unknown }>(result);
    if (items.length === 0) {
      return [];
    }

    return items.map((item) => ({
      text: item.content,
      score: item.score,
      metadata: item.metadata,
    }));
  } catch (error) {
    console.error('Error finding similar context:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Used as fallback when SurrealDB vector functions are not available
 */
export function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Delete all embeddings for a user
 */
export async function deleteUserEmbeddings(userId: string): Promise<void> {
  const db = getDatabase();

  try {
    await db.query('DELETE embedding WHERE userId = $userId', { userId });
  } catch (error) {
    console.error('Error deleting user embeddings:', error);
    throw error;
  }
}

/**
 * Generate and store embedding for a conflict
 * Combines title and description into a searchable text representation
 */
export async function generateConflictEmbedding(
  conflictId: string,
  title: string,
  description?: string
): Promise<void> {
  const db = getDatabase();

  // Combine title and description for embedding
  const textParts = [title];
  if (description && description.trim()) {
    textParts.push(description);
  }
  const content = textParts.join('\n');

  try {
    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Get conflict to find userId
    const fullId = conflictId.startsWith('conflict:')
      ? conflictId
      : `conflict:${conflictId}`;

    const conflictResult = await db.query(
      'SELECT partner_a_id FROM $conflictId',
      { conflictId: fullId }
    );

    const conflictData = extractQueryResult<{ partner_a_id: string }>(conflictResult);
    if (conflictData.length === 0) {
      throw new Error('Conflict not found');
    }

    const userId = conflictData[0].partner_a_id;

    // Store embedding
    await db.query(
      `CREATE embedding CONTENT {
        userId: $userId,
        content: $content,
        embedding: $embedding,
        metadata: {
          type: 'conflict',
          sourceId: $conflictId,
          createdAt: $createdAt
        }
      }`,
      {
        userId,
        content,
        embedding,
        conflictId: fullId,
        createdAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Error generating conflict embedding:', error);
    // Don't throw - embeddings are optional, failure shouldn't break conflict creation
  }
}
