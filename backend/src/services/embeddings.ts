import Anthropic from '@anthropic-ai/sdk';
import { getDatabase } from './db';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
}

/**
 * Generate text embedding using Claude's API
 * Note: This is a placeholder - Claude doesn't currently provide embeddings API
 * In production, use OpenAI embeddings or a dedicated embedding service
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // For now, we'll create a simple hash-based pseudo-embedding
  // In production, replace with actual embedding service like:
  // - OpenAI embeddings API
  // - Cohere embeddings
  // - Local sentence transformers

  const normalized = text.toLowerCase().trim();
  const embedding = new Array(768).fill(0);

  // Simple character-based pseudo-embedding for testing
  for (let i = 0; i < normalized.length && i < 100; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = (charCode * (i + 1)) % 768;
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
    const result = await db.query<EmbeddingDocument[]>(
      'SELECT * FROM embedding WHERE userId = $userId',
      { userId }
    );

    if (!result || result.length === 0 || !result[0].result) {
      return [];
    }

    const documents = result[0].result;

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
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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
