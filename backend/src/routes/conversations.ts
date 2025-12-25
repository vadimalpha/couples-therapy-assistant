import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateUser } from '../middleware/auth';
import { conversationService } from '../services/conversation';

const router = Router();

/**
 * Create a new conversation session
 * POST /api/conversations
 */
router.post(
  '/',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionType, conflictId } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!sessionType) {
        res.status(400).json({ error: 'sessionType is required' });
        return;
      }

      const validTypes = [
        'intake',
        'individual_a',
        'individual_b',
        'joint_context_a',
        'joint_context_b',
        'relationship_shared',
      ];

      if (!validTypes.includes(sessionType)) {
        res.status(400).json({ error: 'Invalid sessionType' });
        return;
      }

      const session = await conversationService.createSession(
        userId,
        sessionType,
        conflictId
      );

      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating conversation session:', error);
      res.status(500).json({ error: 'Failed to create conversation session' });
    }
  }
);

/**
 * Get a conversation session by ID
 * GET /api/conversations/:id
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

      const session = await conversationService.getSession(id);

      if (!session) {
        res.status(404).json({ error: 'Conversation session not found' });
        return;
      }

      // Verify the user owns this session
      if (session.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(session);
    } catch (error) {
      console.error('Error fetching conversation session:', error);
      res.status(500).json({ error: 'Failed to fetch conversation session' });
    }
  }
);

/**
 * Add a message to a conversation session
 * POST /api/conversations/:id/messages
 */
router.post(
  '/:id/messages',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { role, content, senderId } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!role || !content) {
        res.status(400).json({ error: 'role and content are required' });
        return;
      }

      const validRoles = ['user', 'ai', 'partner-a', 'partner-b'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }

      // Verify the user owns this session
      const session = await conversationService.getSession(id);
      if (!session) {
        res.status(404).json({ error: 'Conversation session not found' });
        return;
      }

      if (session.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const message = await conversationService.addMessage(
        id,
        role,
        content,
        senderId
      );

      res.status(201).json(message);
    } catch (error) {
      console.error('Error adding message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add message';
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Finalize a conversation session (lock it)
 * POST /api/conversations/:id/finalize
 */
router.post(
  '/:id/finalize',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Verify the user owns this session
      const session = await conversationService.getSession(id);
      if (!session) {
        res.status(404).json({ error: 'Conversation session not found' });
        return;
      }

      if (session.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const finalizedSession = await conversationService.finalizeSession(id);

      res.json(finalizedSession);
    } catch (error) {
      console.error('Error finalizing conversation session:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to finalize conversation session';
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Get all conversation sessions for the authenticated user
 * GET /api/conversations
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

      const sessions = await conversationService.getUserSessions(userId);

      res.json(sessions);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      res.status(500).json({ error: 'Failed to fetch conversation sessions' });
    }
  }
);

export default router;
