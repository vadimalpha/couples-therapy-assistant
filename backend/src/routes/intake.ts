import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateUser } from '../middleware/auth';
import { intakeService } from '../services/intake';
import { conversationService } from '../services/conversation';
import { streamIntakeResponse, validateApiKey } from '../services/ai-intake';
import { contentFilter } from '../services/content-filter';

const router = Router();

/**
 * Get or create intake conversation session
 * GET /api/intake/conversation
 *
 * Returns existing active intake session or creates a new one
 */
router.get(
  '/conversation',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const session = await intakeService.getOrCreateIntakeSession(userId);

      res.json(session);
    } catch (error) {
      console.error('Error getting intake conversation:', error);
      res.status(500).json({ error: 'Failed to get intake conversation' });
    }
  }
);

/**
 * Send message to intake conversation and stream AI response
 * POST /api/intake/messages
 *
 * Adds user message to conversation and triggers streaming AI response
 */
router.post(
  '/messages',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { content } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!content) {
        res.status(400).json({ error: 'content is required' });
        return;
      }

      // Verify API key is configured
      if (!validateApiKey()) {
        res.status(503).json({ error: 'AI service not configured' });
        return;
      }

      // Get or create intake session
      const session = await intakeService.getOrCreateIntakeSession(userId);

      // Add user message
      await conversationService.addMessage(session.id, 'user', content, userId);

      // Get updated session with all messages
      const updatedSession = await conversationService.getSession(session.id);

      if (!updatedSession) {
        res.status(500).json({ error: 'Failed to retrieve session' });
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
        const messages = updatedSession.messages || [];

        // Check if this is a refresh (user has previous intake data)
        const previousIntakeData = await intakeService.getIntakeData(userId);
        const isRefresh = !!previousIntakeData;

        // Prepare context
        const context = {
          userId,
          isRefresh,
          previousIntakeData: previousIntakeData || undefined,
        };

        let fullContent = '';

        // Stream the AI response
        const { fullContent: content, usage } = await streamIntakeResponse(
          messages,
          context,
          (chunk) => {
            fullContent += chunk;

            // Send chunk via SSE
            const data = JSON.stringify({
              type: 'chunk',
              content: chunk,
            });
            res.write(`data: ${data}\n\n`);
          }
        );

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
              sessionId: session.id,
            }
          );

          // Use fallback message instead
          const fallbackMessage = contentFilter.getFallbackMessage();

          // Save fallback message to conversation
          await conversationService.addMessage(session.id, 'ai', fallbackMessage);

          // Send fallback via SSE
          const fallbackData = JSON.stringify({
            type: 'filtered',
            content: fallbackMessage,
            reason: 'Content filtered for safety',
          });
          res.write(`data: ${fallbackData}\n\n`);
        } else {
          // Save AI response to conversation (safe content)
          await conversationService.addMessage(session.id, 'ai', fullContent);
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
            error instanceof Error
              ? error.message
              : 'Failed to generate AI response',
        });
        res.write(`data: ${errorData}\n\n`);
      } finally {
        // Close the connection
        res.end();
      }
    } catch (error) {
      console.error('Error in intake messages endpoint:', error);

      // If headers not sent yet, send error response
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * Finalize intake conversation
 * POST /api/intake/finalize
 *
 * Finalizes the intake session and extracts structured data
 */
router.post(
  '/finalize',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get user's intake session
      const session = await intakeService.getIntakeSession(userId);

      if (!session) {
        res.status(404).json({ error: 'No intake session found' });
        return;
      }

      if (session.status === 'finalized') {
        res.status(400).json({ error: 'Intake already finalized' });
        return;
      }

      // Finalize and extract data
      const intakeData = await intakeService.finalizeIntake(session.id);

      res.json({
        message: 'Intake finalized successfully',
        data: intakeData,
      });
    } catch (error) {
      console.error('Error finalizing intake:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to finalize intake';
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Trigger quarterly intake refresh
 * PATCH /api/intake/refresh
 *
 * Creates a new intake session for quarterly update
 */
router.patch(
  '/refresh',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Create refresh session
      const session = await intakeService.refreshIntake(userId);

      res.json({
        message: 'Intake refresh session created',
        session,
      });
    } catch (error) {
      console.error('Error creating intake refresh:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create intake refresh';
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Get user's intake data
 * GET /api/intake/data
 *
 * Returns the user's extracted intake data if available
 */
router.get(
  '/data',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const intakeData = await intakeService.getIntakeData(userId);

      if (!intakeData) {
        res.status(404).json({ error: 'No intake data found' });
        return;
      }

      res.json(intakeData);
    } catch (error) {
      console.error('Error fetching intake data:', error);
      res.status(500).json({ error: 'Failed to fetch intake data' });
    }
  }
);

export default router;
