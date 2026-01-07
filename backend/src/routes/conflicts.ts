import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateUser } from '../middleware/auth';
import { conflictService } from '../services/conflict';
import { conversationService } from '../services/conversation';
import { generateRelationshipSynthesis } from '../services/chat-ai';
import { getUserByFirebaseUid, getUserById } from '../services/user';
import { getRelationshipById } from '../services/relationship';

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
      const { title, privacy, relationshipId, guidanceMode, description } = req.body;
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

      // Validate guidanceMode if provided, default to 'conversational'
      const validGuidanceModes = ['structured', 'conversational', 'test'];
      const mode = guidanceMode || 'conversational';

      if (!validGuidanceModes.includes(mode)) {
        res
          .status(400)
          .json({ error: 'guidanceMode must be "structured", "conversational", or "test"' });
        return;
      }

      const conflict = await conflictService.createConflict(
        userId,
        title,
        privacy,
        relationshipId,
        mode,
        description
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

      // Enrich conflicts with partner info
      const enrichedConflicts = await Promise.all(
        conflicts.map(async (conflict) => {
          // Determine which partner to look up (the one that isn't the current user)
          const isPartnerA = conflict.partner_a_id === userId;
          const partnerFirebaseUid = isPartnerA ? conflict.partner_b_id : conflict.partner_a_id;

          let partnerName: string | null = null;
          let partnerEmail: string | null = null;

          if (partnerFirebaseUid) {
            // Partner already assigned to conflict - look them up directly
            const partner = await getUserByFirebaseUid(partnerFirebaseUid);
            if (partner) {
              partnerName = partner.displayName || null;
              partnerEmail = partner.email || null;
            }
          } else if (conflict.relationship_id && isPartnerA) {
            // Partner B hasn't joined yet - get partner from relationship
            // (Only for Partner A viewing, since Partner B won't see conflicts they haven't joined)
            const currentUser = await getUserByFirebaseUid(userId);
            if (currentUser) {
              const relationship = await getRelationshipById(conflict.relationship_id);
              if (relationship) {
                // Find the other user in the relationship
                const partnerId = relationship.user1Id === currentUser.id
                  ? relationship.user2Id
                  : relationship.user1Id;
                const partner = await getUserById(partnerId);
                if (partner) {
                  partnerName = partner.displayName || null;
                  partnerEmail = partner.email || null;
                }
              }
            }
          }

          return {
            ...conflict,
            partnerName,
            partnerEmail,
          };
        })
      );

      res.json(enrichedConflicts);
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
 * Join a conflict as Partner B (creates their session)
 * POST /api/conflicts/:id/join
 */
router.post(
  '/:id/join',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const conflict = await conflictService.getConflict(id);

      if (!conflict) {
        res.status(404).json({ error: 'Conflict not found' });
        return;
      }

      // User must be Partner B (via relationship) but not yet have a session
      if (conflict.partner_a_id === userId) {
        res.status(400).json({ error: 'Partner A cannot join their own conflict' });
        return;
      }

      if (conflict.partner_b_session_id) {
        // Session already exists, just return success
        res.json({
          conflict,
          sessionId: conflict.partner_b_session_id,
          message: 'Already joined'
        });
        return;
      }

      // Allow joining when Partner A is still chatting OR when waiting for Partner B
      if (!['partner_a_chatting', 'pending_partner_b'].includes(conflict.status)) {
        res.status(400).json({
          error: 'Cannot join conflict in current status',
          status: conflict.status
        });
        return;
      }

      // Create Partner B's session by calling invitePartnerB with their userId
      const updatedConflict = await conflictService.invitePartnerB(id, userId);

      res.json({
        conflict: updatedConflict,
        sessionId: updatedConflict.partner_b_session_id,
        message: 'Successfully joined conflict'
      });
    } catch (error) {
      console.error('Error joining conflict:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to join conflict';
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

/**
 * Get the shared session for a conflict (for relationship guidance)
 * GET /api/conflicts/:id/shared-session
 */
router.get(
  '/:id/shared-session',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Verify user is part of this conflict
      const conflict = await conflictService.getConflict(id);

      if (!conflict) {
        res.status(404).json({ error: 'Conflict not found' });
        return;
      }

      if (conflict.partner_a_id !== userId && conflict.partner_b_id !== userId) {
        res.status(403).json({ error: 'Access denied: User is not part of this conflict' });
        return;
      }

      // Check if both partners have finalized their exploration
      if (conflict.status !== 'both_finalized') {
        res.status(404).json({ error: 'Shared session not yet available - both partners must complete exploration first' });
        return;
      }

      // Find the relationship_shared session for this conflict
      const sessions = await conversationService.getSessionsByConflict(id);
      let sharedSession = sessions.find(s => s.sessionType === 'relationship_shared');

      // If no shared session exists, create one and generate initial synthesis
      if (!sharedSession) {
        console.log(`Creating relationship_shared session for conflict ${id}`);
        sharedSession = await conversationService.createSession(
          conflict.partner_a_id,
          'relationship_shared',
          id
        );
      }

      // Only generate synthesis for brand new sessions (no messages yet)
      // If the session already has messages, it's been used and we shouldn't add synthesis at the end
      const needsSynthesis = !sharedSession.messages || sharedSession.messages.length === 0;

      // Generate the relationship synthesis for new sessions
      if (needsSynthesis) {
        console.log(`Generating initial synthesis for new shared session ${sharedSession.id}`);
        try {
          const synthesisResult = await generateRelationshipSynthesis({
            sessionId: sharedSession.id,
            conflictId: id,
            partnerAId: conflict.partner_a_id,
            partnerBId: conflict.partner_b_id || '',
          });

          // Save the synthesis as the first AI message
          await conversationService.addMessage(
            sharedSession.id,
            'ai',
            synthesisResult.content
          );

          console.log(`Initial synthesis added to shared session ${sharedSession.id}`);
        } catch (synthError) {
          console.error('Error generating initial synthesis:', synthError);
          // Continue without synthesis - the session is still usable
        }
      }

      res.json({
        sessionId: sharedSession.id,
        conflictId: id,
        status: sharedSession.status,
      });
    } catch (error) {
      console.error('Error fetching shared session:', error);
      res.status(500).json({ error: 'Failed to fetch shared session' });
    }
  }
);

export default router;
