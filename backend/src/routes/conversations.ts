import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateUser } from '../middleware/auth';
import { conversationService } from '../services/conversation';
import {
  streamExplorationResponse,
  validateApiKey,
} from '../services/ai-exploration';

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
 * Stream AI response for a conversation session
 * POST /api/conversations/:id/ai-stream
 *
 * This endpoint triggers AI response generation after a user message.
 * It streams the response using Server-Sent Events (SSE).
 */
router.post(
  '/:id/ai-stream',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Verify API key is configured
      if (!validateApiKey()) {
        res.status(503).json({ error: 'AI service not configured' });
        return;
      }

      // Get the session
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

      // Only trigger AI for exploration sessions (individual sessions)
      const explorationSessionTypes = ['individual_a', 'individual_b'];
      if (!explorationSessionTypes.includes(session.sessionType)) {
        res.status(400).json({
          error: 'AI responses only available for exploration sessions',
        });
        return;
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send initial connection confirmation
      res.write('data: {"type":"connected"}\n\n');

      try {
        // Get conversation history
        const messages = session.messages || [];

        // Prepare context
        const context = {
          userId,
          sessionType: session.sessionType,
          // TODO: Add intake data when available
          intakeData: undefined,
          relationshipContext: undefined,
        };

        let fullContent = '';

        // Stream the AI response
        const { fullContent: content, usage } =
          await streamExplorationResponse(messages, context, (chunk) => {
            fullContent += chunk;

            // Send chunk via SSE
            const data = JSON.stringify({
              type: 'chunk',
              content: chunk,
            });
            res.write(`data: ${data}\n\n`);
          });

        fullContent = content;

        // Save AI response to conversation
        await conversationService.addMessage(id, 'ai', fullContent);

        // Send completion event with usage stats
        const completionData = JSON.stringify({
          type: 'complete',
          usage: {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cost: usage.totalCost.toFixed(6),
          },
        });
        res.write(`data: ${completionData}\n\n`);

        // Send done event
        res.write('data: {"type":"done"}\n\n');
      } catch (error) {
        console.error('Error streaming AI response:', error);

        // Send error event
        const errorData = JSON.stringify({
          type: 'error',
          error:
            error instanceof Error ? error.message : 'Failed to generate AI response',
        });
        res.write(`data: ${errorData}\n\n`);
      } finally {
        // Close the connection
        res.end();
      }
    } catch (error) {
      console.error('Error in AI stream endpoint:', error);

      // If headers not sent yet, send error response
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
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
