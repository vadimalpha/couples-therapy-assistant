import { Router, Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
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

export default router;
