import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser } from '../middleware/auth';
import { moderationLimiter } from '../middleware/rate-limit';
import { getDatabase } from '../services/db';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * Moderation Routes
 *
 * Handles user reports of problematic AI advice or content.
 * All reports are logged for review and system improvement.
 */

interface ModerationReport {
  id: string;
  userId: string;
  conflictId?: string;
  conversationId?: string;
  messageId?: string;
  reason: string;
  description?: string;
  reportedAt: string;
}

/**
 * POST /api/moderation/report
 * Report problematic AI advice or content
 *
 * Body:
 * - conflictId (optional): ID of the conflict
 * - conversationId (optional): ID of the conversation
 * - messageId (optional): Specific message being reported
 * - reason: Category of the issue
 * - description (optional): Additional details
 */
router.post(
  '/report',
  authenticateUser,
  moderationLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { conflictId, conversationId, messageId, reason, description } = req.body;

      // Validate required fields
      if (!reason) {
        res.status(400).json({ error: 'Reason is required' });
        return;
      }

      // Validate reason category
      const validReasons = [
        'harmful_advice',
        'inappropriate_content',
        'technical_error',
        'privacy_concern',
        'bias_concern',
        'other',
      ];

      if (!validReasons.includes(reason)) {
        res.status(400).json({
          error: 'Invalid reason',
          validReasons,
        });
        return;
      }

      const db = getDatabase();

      // Create moderation report record
      const report: ModerationReport = {
        id: uuidv4(),
        userId,
        conflictId: conflictId || undefined,
        conversationId: conversationId || undefined,
        messageId: messageId || undefined,
        reason,
        description: description || undefined,
        reportedAt: new Date().toISOString(),
      };

      // Store in database
      await db.create('moderation_logs', report);

      // Log to console for immediate visibility
      console.warn('Moderation report received:', {
        reportId: report.id,
        userId: report.userId,
        reason: report.reason,
        timestamp: report.reportedAt,
      });

      res.status(201).json({
        message: 'Report submitted successfully',
        reportId: report.id,
      });
    } catch (error) {
      console.error('Error creating moderation report:', error);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  }
);

/**
 * GET /api/moderation/reports
 * Get moderation reports for the current user
 * Allows users to see their own reports
 */
router.get(
  '/reports',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const db = getDatabase();

      // Query user's reports
      const result = await db.query(
        'SELECT * FROM moderation_logs WHERE userId = $userId ORDER BY reportedAt DESC',
        { userId }
      );

      const reports = result[0]?.result || [];

      res.json({
        reports,
        count: reports.length,
      });
    } catch (error) {
      console.error('Error fetching moderation reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }
);

/**
 * GET /api/moderation/stats
 * Get moderation statistics (for admin/monitoring)
 * Currently public, should be admin-only in production
 */
router.get('/stats', async (req, res: Response) => {
  try {
    const db = getDatabase();

    // Get report counts by reason
    const result = await db.query(`
      SELECT
        reason,
        count() as count
      FROM moderation_logs
      GROUP BY reason
    `);

    const stats = result[0]?.result || [];

    res.json({
      reasonBreakdown: stats,
      totalReports: stats.reduce((sum: number, stat: any) => sum + (stat.count || 0), 0),
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
