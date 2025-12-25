import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateUser } from '../middleware/auth';
import { conflictService } from '../services/conflict';
import { conversationService } from '../services/conversation';

const router = Router();

/**
 * Create a new conflict and automatically create Partner A's individual session
 * POST /api/conflicts
 */
router.post(
  '/',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, privacy, relationshipId } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!title || !privacy || !relationshipId) {
        res
          .status(400)
          .json({ error: 'title, privacy, and relationshipId are required' });
        return;
      }

      if (!['private', 'shared'].includes(privacy)) {
        res
          .status(400)
          .json({ error: 'privacy must be either "private" or "shared"' });
        return;
      }

      const conflict = await conflictService.createConflict(
        userId,
        title,
        privacy,
        relationshipId
      );

      res.status(201).json(conflict);
    } catch (error) {
      console.error('Error creating conflict:', error);
      res.status(500).json({ error: 'Failed to create conflict' });
    }
  }
);

/**
 * Get a conflict by ID with visibility filtering
 * GET /api/conflicts/:id
 */
router.get(
  '/:id',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const result = await conflictService.getConflictWithVisibility(
        id,
        userId
      );

      if (!result) {
        res.status(404).json({ error: 'Conflict not found' });
        return;
      }

      const { conflict, canViewPartnerASession, canViewPartnerBSession } =
        result;

      // Fetch sessions if user has visibility
      let partnerASession = null;
      let partnerBSession = null;

      if (canViewPartnerASession && conflict.partner_a_session_id) {
        partnerASession = await conversationService.getSession(
          conflict.partner_a_session_id
        );
      }

      if (canViewPartnerBSession && conflict.partner_b_session_id) {
        partnerBSession = await conversationService.getSession(
          conflict.partner_b_session_id
        );
      }

      res.json({
        conflict,
        partnerASession,
        partnerBSession,
        visibility: {
          canViewPartnerASession,
          canViewPartnerBSession,
        },
      });
    } catch (error) {
      console.error('Error fetching conflict:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch conflict';

      // Handle access denied errors with 403
      if (errorMessage.includes('Access denied')) {
        res.status(403).json({ error: errorMessage });
        return;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Get all conflicts for the authenticated user
 * GET /api/conflicts
 */
router.get(
  '/',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const conflicts = await conflictService.getUserConflicts(userId);

      res.json(conflicts);
    } catch (error) {
      console.error('Error fetching user conflicts:', error);
      res.status(500).json({ error: 'Failed to fetch conflicts' });
    }
  }
);

/**
 * Invite Partner B to join the conflict
 * POST /api/conflicts/:id/invite
 */
router.post(
  '/:id/invite',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { partnerBId } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!partnerBId) {
        res.status(400).json({ error: 'partnerBId is required' });
        return;
      }

      // Verify user is Partner A for this conflict
      const conflict = await conflictService.getConflict(id);

      if (!conflict) {
        res.status(404).json({ error: 'Conflict not found' });
        return;
      }

      if (conflict.partner_a_id !== userId) {
        res
          .status(403)
          .json({ error: 'Only Partner A can invite Partner B' });
        return;
      }

      const updatedConflict = await conflictService.invitePartnerB(
        id,
        partnerBId
      );

      res.json(updatedConflict);
    } catch (error) {
      console.error('Error inviting Partner B:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to invite Partner B';
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Update conflict status
 * POST /api/conflicts/:id/status
 */
router.post(
  '/:id/status',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
      }

      const validStatuses = [
        'partner_a_chatting',
        'pending_partner_b',
        'partner_b_chatting',
        'both_finalized',
      ];

      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      // Verify user is part of this conflict
      const conflict = await conflictService.getConflict(id);

      if (!conflict) {
        res.status(404).json({ error: 'Conflict not found' });
        return;
      }

      if (
        conflict.partner_a_id !== userId &&
        conflict.partner_b_id !== userId
      ) {
        res
          .status(403)
          .json({ error: 'Access denied: User is not part of this conflict' });
        return;
      }

      const updatedConflict = await conflictService.updateStatus(id, status);

      res.json(updatedConflict);
    } catch (error) {
      console.error('Error updating conflict status:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update conflict status';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
