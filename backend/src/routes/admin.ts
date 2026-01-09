import { Router, Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest, IntakeData } from '../types';
import {
  getPromptLogs,
  getPromptLogCount,
  getPromptLogStats,
  deleteOldLogs,
} from '../services/prompt-logger';
import {
  listPromptTemplates,
  getPromptTemplate,
  updatePromptTemplate,
  getPromptTemplatesByCategory,
  getModeVariants,
} from '../services/prompt-template';
import { listAllUsers } from '../services/user';
import { getDatabase } from '../services/db';
import { embedIntakeData, embedAndStore, searchSimilar } from '../services/embeddings';

const router = Router();

// Admin email whitelist
const ADMIN_EMAILS = ['vadim@cvetlo.com', 'vadim@alphapoint.com', 'claude-test@couples-app.local', 'claude-partner@couples-app.local', 'claude.test.partnera@gmail.com', 'claude.test.partnerb@gmail.com'];

/**
 * Middleware to check if user is an admin
 */
async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userEmail = req.user.email;
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }

  next();
}

/**
 * GET /api/admin/prompt-logs
 * Get prompt logs with optional filters
 */
router.get(
  '/prompt-logs',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        limit = '100',
        offset = '0',
        userId,
        logType,
        conflictId,
      } = req.query;

      const logs = await getPromptLogs({
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        userId: userId as string | undefined,
        logType: logType as any,
        conflictId: conflictId as string | undefined,
      });

      const count = await getPromptLogCount({
        userId: userId as string | undefined,
        logType: logType as any,
        conflictId: conflictId as string | undefined,
      });

      res.json({
        logs,
        total: count,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });
    } catch (error) {
      console.error('Error fetching prompt logs:', error);
      res.status(500).json({ error: 'Failed to fetch prompt logs' });
    }
  }
);

/**
 * GET /api/admin/prompt-logs/stats
 * Get aggregated stats for prompt logs
 */
router.get(
  '/prompt-logs/stats',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await getPromptLogStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching prompt log stats:', error);
      res.status(500).json({ error: 'Failed to fetch prompt log stats' });
    }
  }
);

/**
 * GET /api/admin/prompt-logs/:id
 * Get a single prompt log by ID
 */
router.get(
  '/prompt-logs/:id',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const logs = await getPromptLogs({ limit: 1 });

      // Find the specific log by ID using a query
      const { getDatabase } = await import('../services/db');
      const db = getDatabase();
      const result = await db.query('SELECT * FROM $id', { id });
      const log = (result as any)?.[0]?.[0];

      if (!log) {
        res.status(404).json({ error: 'Prompt log not found' });
        return;
      }

      res.json(log);
    } catch (error) {
      console.error('Error fetching prompt log:', error);
      res.status(500).json({ error: 'Failed to fetch prompt log' });
    }
  }
);

/**
 * DELETE /api/admin/prompt-logs/cleanup
 * Delete old prompt logs
 */
router.delete(
  '/prompt-logs/cleanup',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { daysOld = '30' } = req.query;
      const deleted = await deleteOldLogs(parseInt(daysOld as string, 10));
      res.json({ deleted, message: `Deleted ${deleted} logs older than ${daysOld} days` });
    } catch (error) {
      console.error('Error cleaning up prompt logs:', error);
      res.status(500).json({ error: 'Failed to clean up prompt logs' });
    }
  }
);

// ============================================
// Prompt Template Management Routes
// ============================================

/**
 * GET /api/admin/prompt-templates
 * List all prompt templates
 */
router.get(
  '/prompt-templates',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { grouped } = req.query;

      if (grouped === 'true') {
        const templates = getPromptTemplatesByCategory();
        res.json(templates);
      } else {
        const templates = listPromptTemplates();
        res.json(templates);
      }
    } catch (error) {
      console.error('Error listing prompt templates:', error);
      res.status(500).json({ error: 'Failed to list prompt templates' });
    }
  }
);

/**
 * GET /api/admin/prompt-templates/:name
 * Get a specific prompt template
 */
router.get(
  '/prompt-templates/:name',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name } = req.params;

      // Validate filename
      if (!name.endsWith('.txt') || name.includes('..') || name.includes('/')) {
        res.status(400).json({ error: 'Invalid template name' });
        return;
      }

      const template = getPromptTemplate(name);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching prompt template:', error);
      res.status(500).json({ error: 'Failed to fetch prompt template' });
    }
  }
);

/**
 * GET /api/admin/prompt-templates/:name/variants
 * Get all mode variants of a prompt template
 */
router.get(
  '/prompt-templates/:name/variants',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name } = req.params;

      // Validate filename
      if (!name.endsWith('.txt') || name.includes('..') || name.includes('/')) {
        res.status(400).json({ error: 'Invalid template name' });
        return;
      }

      const variants = getModeVariants(name);
      res.json(variants);
    } catch (error) {
      console.error('Error fetching template variants:', error);
      res.status(500).json({ error: 'Failed to fetch template variants' });
    }
  }
);

/**
 * PUT /api/admin/prompt-templates/:name
 * Update a prompt template
 */
router.put(
  '/prompt-templates/:name',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name } = req.params;
      const { content } = req.body;

      // Validate filename
      if (!name.endsWith('.txt') || name.includes('..') || name.includes('/')) {
        res.status(400).json({ error: 'Invalid template name' });
        return;
      }

      // Validate content (allow empty string but must be a string)
      if (content === undefined || content === null || typeof content !== 'string') {
        res.status(400).json({ error: 'Content must be a string' });
        return;
      }

      // Validate content length (prevent excessively large templates)
      if (content.length > 50000) {
        res.status(400).json({ error: 'Content exceeds maximum length (50000 characters)' });
        return;
      }

      const success = updatePromptTemplate(name, content);

      if (!success) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({ success: true, message: `Template ${name} updated successfully` });
    } catch (error) {
      console.error('Error updating prompt template:', error);
      res.status(500).json({ error: 'Failed to update prompt template' });
    }
  }
);

// ============================================
// User Management Routes (for impersonation)
// ============================================

/**
 * GET /api/admin/users
 * List all users for admin impersonation
 */
router.get(
  '/users',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await listAllUsers();
      res.json({ users });
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  }
);

// ============================================
// Embeddings Backfill Routes
// ============================================

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
 * POST /api/admin/backfill-embeddings
 * Trigger embeddings backfill for all users with intake data
 */
router.post(
  '/backfill-embeddings',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const db = getDatabase();
    const results = {
      intake: { success: 0, errors: 0, details: [] as string[] },
      conversations: { success: 0, errors: 0, details: [] as string[] },
    };

    try {
      // Backfill intake embeddings
      const usersResult = await db.query(
        'SELECT id, firebaseUid, email, intakeData FROM user WHERE intakeData != NONE'
      );
      const users = extractQueryResult<UserWithIntake>(usersResult);
      results.intake.details.push(`Found ${users.length} users with intake data`);

      for (const user of users) {
        if (!user.intakeData) continue;

        try {
          // Use firebaseUid to match how searchSimilar queries (via context.userId from routes)
          await embedIntakeData(user.firebaseUid, {
            name: user.intakeData.name,
            relationship_duration: user.intakeData.relationship_duration,
            communication_style_summary: user.intakeData.communication_style_summary,
            conflict_triggers: user.intakeData.conflict_triggers,
            previous_patterns: user.intakeData.previous_patterns,
            relationship_goals: user.intakeData.relationship_goals,
          });
          results.intake.success++;
          results.intake.details.push(`✓ ${user.email || user.id}`);
        } catch (error) {
          results.intake.errors++;
          results.intake.details.push(`✗ ${user.email || user.id}: ${error}`);
        }
      }

      // Backfill conversation embeddings
      const sessionsResult = await db.query(
        'SELECT id, userId, sessionType, messages FROM conversation WHERE messages != NONE AND array::len(messages) > 0'
      );
      const sessions = extractQueryResult<ConversationWithMessages>(sessionsResult);
      results.conversations.details.push(`Found ${sessions.length} conversations with messages`);

      for (const session of sessions) {
        if (!session.messages || session.messages.length === 0) continue;

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
            results.conversations.success++;
          } catch (error) {
            results.conversations.errors++;
          }
        }
        results.conversations.details.push(`Processed ${userMessages.length} messages from ${session.id}`);
      }

      res.json({
        success: true,
        results,
        summary: {
          intakeEmbeddings: results.intake.success,
          intakeErrors: results.intake.errors,
          conversationEmbeddings: results.conversations.success,
          conversationErrors: results.conversations.errors,
        },
      });
    } catch (error) {
      console.error('Error during backfill:', error);
      res.status(500).json({
        error: 'Backfill failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        partialResults: results,
      });
    }
  }
);

/**
 * GET /api/admin/embeddings/:userId
 * Debug endpoint to check embeddings for a user
 */
router.get(
  '/embeddings/:userId',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const db = getDatabase();

    try {
      const result = await db.query(
        'SELECT id, userId, content, metadata FROM embedding WHERE userId = $userId LIMIT 20',
        { userId }
      );
      const embeddings = extractQueryResult<{
        id: string;
        userId: string;
        content: string;
        metadata: { type: string; sourceId: string; createdAt: string };
      }>(result);

      // Also get total count
      const countResult = await db.query(
        'SELECT count() FROM embedding WHERE userId = $userId GROUP ALL',
        { userId }
      );
      const countData = extractQueryResult<{ count: number }>(countResult);
      const totalCount = countData[0]?.count || 0;

      res.json({
        userId,
        totalCount,
        sample: embeddings.map(e => ({
          id: e.id,
          contentPreview: e.content?.substring(0, 100) + '...',
          type: e.metadata?.type,
          sourceId: e.metadata?.sourceId,
        })),
      });
    } catch (error) {
      console.error('Error fetching embeddings:', error);
      res.status(500).json({
        error: 'Failed to fetch embeddings',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/admin/embeddings/:userId/search
 * Debug endpoint to test similarity search
 */
router.get(
  '/embeddings/:userId/search',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query parameter required' });
      return;
    }

    try {
      const results = await searchSimilar(userId, query, 10);

      res.json({
        userId,
        query,
        resultCount: results.length,
        results: results.map(r => ({
          similarity: r.similarity.toFixed(4),
          type: r.metadata?.type,
          contentPreview: r.content?.substring(0, 100) + '...',
        })),
      });
    } catch (error) {
      console.error('Error in similarity search:', error);
      res.status(500).json({
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
