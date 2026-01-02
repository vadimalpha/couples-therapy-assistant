import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateUser } from '../middleware/auth';
import { conversationService } from '../services/conversation';
import {
  streamExplorationResponse,
  streamGuidanceRefinementResponse,
  validateApiKey,
  GuidanceRefinementContext,
} from '../services/chat-ai';
import { contentFilter } from '../services/content-filter';

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

      // For relationship_shared sessions, verify access through conflict/relationship
      if (session.sessionType === 'relationship_shared') {
        const hasAccess = await conversationService.verifyUserAccessToSession(
          id,
          userId
        );

        if (!hasAccess) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      } else {
        // For other sessions, verify the user owns this session
        if (session.userId !== userId) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
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

      // Verify the user has access to this session
      const session = await conversationService.getSession(id);
      if (!session) {
        res.status(404).json({ error: 'Conversation session not found' });
        return;
      }

      // For relationship_shared sessions, verify access through conflict/relationship
      if (session.sessionType === 'relationship_shared') {
        const hasAccess = await conversationService.verifyUserAccessToSession(
          id,
          userId
        );

        if (!hasAccess) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      } else {
        // For other sessions, verify the user owns this session
        if (session.userId !== userId) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      }

      // Use senderId from request body or default to authenticated userId
      const message = await conversationService.addMessage(
        id,
        role,
        content,
        senderId || userId
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

        // Content safety check before saving
        const safetyCheck = await contentFilter.checkForHarmfulContent(fullContent);

        if (!safetyCheck.isSafe) {
          // Log the filtered content
          await contentFilter.logFilteredContent(
            fullContent,
            safetyCheck.reason || 'Unknown',
            safetyCheck.severity || 'unknown',
            {
              userId,
              sessionId: id,
            }
          );

          // Use fallback message instead
          const fallbackMessage = contentFilter.getFallbackMessage();

          // Save fallback message to conversation
          await conversationService.addMessage(id, 'ai', fallbackMessage);

          // Send fallback via SSE (overwrite previous chunks)
          const fallbackData = JSON.stringify({
            type: 'filtered',
            content: fallbackMessage,
            reason: 'Content filtered for safety',
          });
          res.write(`data: ${fallbackData}\n\n`);
        } else {
          // Save AI response to conversation (safe content)
          await conversationService.addMessage(id, 'ai', fullContent);
        }

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

/**
 * Debug endpoint for testing guidance AI response
 * POST /api/conversations/:id/debug-guidance
 */
router.post(
  '/:id/debug-guidance',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      console.log(`[debug-guidance] Starting for session=${id}, user=${userId}`);

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Verify API key is configured
      if (!validateApiKey()) {
        res.status(503).json({ error: 'AI service not configured (OPENAI_API_KEY missing)' });
        return;
      }

      // Get the session
      const session = await conversationService.getSession(id);
      if (!session) {
        res.status(404).json({ error: 'Conversation session not found', sessionId: id });
        return;
      }

      console.log(`[debug-guidance] Session found: type=${session.sessionType}, userId=${session.userId}, conflictId=${session.conflictId}`);

      // Return session info first
      const sessionInfo = {
        sessionId: session.id,
        sessionType: session.sessionType,
        sessionUserId: session.userId,
        requestUserId: userId,
        userMatch: session.userId === userId,
        conflictId: session.conflictId,
        messageCount: session.messages?.length || 0,
        status: session.status,
      };

      // Check if it's a guidance session
      if (session.sessionType !== 'joint_context_a' && session.sessionType !== 'joint_context_b') {
        res.json({
          success: false,
          error: `Session type is '${session.sessionType}', not joint_context_a or joint_context_b`,
          sessionInfo,
        });
        return;
      }

      // Verify the user owns this session
      if (session.userId !== userId) {
        res.json({
          success: false,
          error: 'Access denied - user does not own this session',
          sessionInfo,
        });
        return;
      }

      // Try to trigger AI response
      console.log(`[debug-guidance] Attempting to trigger AI response...`);

      const context: GuidanceRefinementContext = {
        userId,
        conflictId: session.conflictId,
        sessionType: session.sessionType as 'joint_context_a' | 'joint_context_b',
      };

      let chunks: string[] = [];

      try {
        const result = await streamGuidanceRefinementResponse(
          session.messages || [],
          context,
          (chunk: string) => {
            chunks.push(chunk);
          }
        );

        console.log(`[debug-guidance] AI response success, content length: ${result.fullContent.length}`);

        // Save AI response to conversation
        await conversationService.addMessage(id, 'ai', result.fullContent);

        res.json({
          success: true,
          sessionInfo,
          aiResponse: {
            contentLength: result.fullContent.length,
            chunkCount: chunks.length,
            usage: result.usage,
            preview: result.fullContent.substring(0, 200) + '...',
          },
        });
      } catch (aiError) {
        console.error(`[debug-guidance] AI response error:`, aiError);
        res.json({
          success: false,
          sessionInfo,
          aiError: aiError instanceof Error ? aiError.message : 'Unknown AI error',
          aiErrorStack: aiError instanceof Error ? aiError.stack : undefined,
        });
      }
    } catch (error) {
      console.error('[debug-guidance] Error:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
