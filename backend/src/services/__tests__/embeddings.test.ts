import {
  generateEmbedding,
  embedAndStore,
  findSimilarContext,
  cosineSimilarity,
} from '../embeddings';
import { getDatabase } from '../db';

jest.mock('../db');
jest.mock('../openai-client');

describe('Embeddings Service', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    };
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should throw error for empty text', async () => {
      await expect(generateEmbedding('')).rejects.toThrow(
        'Cannot generate embedding for empty text'
      );
    });

    it('should throw error for whitespace-only text', async () => {
      await expect(generateEmbedding('   ')).rejects.toThrow(
        'Cannot generate embedding for empty text'
      );
    });

    it('should generate pseudo-embedding when OPENAI_API_KEY is not set', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const embedding = await generateEmbedding('test text');

      expect(embedding).toHaveLength(1536);
      expect(embedding.every((val) => typeof val === 'number')).toBe(true);

      // Restore original key
      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should return normalized embedding vector', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const embedding = await generateEmbedding('test text');

      // Check if vector is normalized (magnitude should be ~1)
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1, 5);

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should generate different embeddings for different text', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const embedding1 = await generateEmbedding('hello world');
      const embedding2 = await generateEmbedding('goodbye world');

      expect(embedding1).not.toEqual(embedding2);

      process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('embedAndStore', () => {
    it('should throw error for empty text', async () => {
      await expect(
        embedAndStore('', {
          type: 'intake',
          referenceId: 'ref123',
          userId: 'user123',
        })
      ).rejects.toThrow('Cannot embed empty text');
    });

    it('should store embedding with correct metadata structure', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockResolvedValue([{ result: [{ id: 'embedding:123' }] }]);

      await embedAndStore('test content', {
        type: 'conflict',
        referenceId: 'conflict:456',
        userId: 'user123',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE embedding CONTENT'),
        expect.objectContaining({
          userId: 'user123',
          content: 'test content',
          type: 'conflict',
          sourceId: 'conflict:456',
          embedding: expect.any(Array),
          createdAt: expect.any(String),
        })
      );

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should trim text before storing', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockResolvedValue([{ result: [{ id: 'embedding:123' }] }]);

      await embedAndStore('  test content  ', {
        type: 'intake',
        referenceId: 'ref123',
        userId: 'user123',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          content: 'test content',
        })
      );

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should throw error if database query fails', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(
        embedAndStore('test content', {
          type: 'intake',
          referenceId: 'ref123',
          userId: 'user123',
        })
      ).rejects.toThrow('Database error');

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should accept all valid metadata types', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockResolvedValue([{ result: [{ id: 'embedding:123' }] }]);

      const types: Array<'intake' | 'conversation' | 'conflict'> = [
        'intake',
        'conversation',
        'conflict',
      ];

      for (const type of types) {
        await embedAndStore('test', {
          type,
          referenceId: 'ref123',
          userId: 'user123',
        });

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ type })
        );

        mockDb.query.mockClear();
      }

      process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('findSimilarContext', () => {
    it('should throw error for empty query text', async () => {
      await expect(findSimilarContext('')).rejects.toThrow(
        'Cannot search with empty query'
      );
    });

    it('should query database with vector similarity function', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockResolvedValue([
        {
          result: [
            {
              content: 'similar text',
              score: 0.95,
              metadata: { type: 'intake', sourceId: 'ref123' },
            },
          ],
        },
      ]);

      const results = await findSimilarContext('query text');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('vector::similarity::cosine'),
        expect.objectContaining({
          queryEmbedding: expect.any(Array),
          limit: 5,
        })
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        text: 'similar text',
        score: 0.95,
        metadata: { type: 'intake', sourceId: 'ref123' },
      });

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should filter by type when provided', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockResolvedValue([{ result: [] }]);

      await findSimilarContext('query text', 'conflict', 10);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('AND metadata.type = $type'),
        expect.objectContaining({
          type: 'conflict',
          limit: 10,
        })
      );

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should respect limit parameter', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockResolvedValue([{ result: [] }]);

      await findSimilarContext('query text', undefined, 3);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          limit: 3,
        })
      );

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should return empty array when no results found', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockResolvedValue([{ result: [] }]);

      const results = await findSimilarContext('query text');

      expect(results).toEqual([]);

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should handle database errors gracefully', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(findSimilarContext('query text')).rejects.toThrow(
        'Database connection failed'
      );

      process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate correct similarity for identical vectors', () => {
      const vector = [1, 2, 3, 4, 5];
      const similarity = cosineSimilarity(vector, vector);
      expect(similarity).toBeCloseTo(1, 10);
    });

    it('should calculate correct similarity for orthogonal vectors', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [0, 1, 0];
      const similarity = cosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(0, 10);
    });

    it('should calculate correct similarity for opposite vectors', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [-1, -2, -3];
      const similarity = cosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(-1, 10);
    });

    it('should throw error for vectors of different lengths', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [1, 2];
      expect(() => cosineSimilarity(vector1, vector2)).toThrow(
        'Vectors must have the same length'
      );
    });

    it('should return 0 for zero vector', () => {
      const vector1 = [0, 0, 0];
      const vector2 = [1, 2, 3];
      const similarity = cosineSimilarity(vector1, vector2);
      expect(similarity).toBe(0);
    });

    it('should handle large dimension vectors', () => {
      const vector1 = new Array(1536).fill(0.5);
      const vector2 = new Array(1536).fill(0.5);
      const similarity = cosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(1, 10);
    });

    it('should calculate similarity for normalized embeddings', () => {
      // Create normalized vectors
      const magnitude1 = Math.sqrt(1 * 1 + 2 * 2 + 3 * 3);
      const vector1 = [1 / magnitude1, 2 / magnitude1, 3 / magnitude1];

      const magnitude2 = Math.sqrt(4 * 4 + 5 * 5 + 6 * 6);
      const vector2 = [4 / magnitude2, 5 / magnitude2, 6 / magnitude2];

      const similarity = cosineSimilarity(vector1, vector2);

      // Should be between 0 and 1 for normalized vectors pointing in similar direction
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });
});
