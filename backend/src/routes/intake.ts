import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateUser } from '../middleware/auth';
import { intakeService } from '../services/intake';
import { conversationService } from '../services/conversation';
import { streamIntakeResponse, validateApiKey } from '../services/chat-ai';
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
 * Get or create intake session with messages
 * POST /api/intake/session
 *
 * Returns existing active intake session with messages, or creates a new one
 * Frontend uses this to initialize/resume intake chat
 */
router.post(
  '/session',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const session = await intakeService.getOrCreateIntakeSession(userId);

      // Get messages for the session
      const fullSession = await conversationService.getSession(session.id);
      const messages = fullSession?.messages || [];

      // Transform messages to frontend format
      const formattedMessages = messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      // Calculate progress based on message count
      const progress = intakeService.calculateProgress(messages.length);

      res.json({
        session: {
          id: session.id,
          status: session.status,
          currentSection: progress.currentSection,
          completedSections: progress.completedSections,
          messageCount: messages.length,
        },
        messages: formattedMessages,
      });
    } catch (error) {
      console.error('Error getting intake session:', error);
      res.status(500).json({ error: 'Failed to get intake session' });
    }
  }
);

/**
 * Start intake conversation with initial AI greeting
 * POST /api/intake/start
 *
 * Sends the initial AI greeting message via SSE streaming
 * Called when a new session is created (no existing messages)
 */
router.post(
  '/start',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { sessionId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!sessionId) {
        res.status(400).json({ error: 'sessionId is required' });
        return;
      }

      // Verify API key is configured
      if (!validateApiKey()) {
        res.status(503).json({ error: 'AI service not configured' });
        return;
      }

      // Verify session belongs to user
      const session = await conversationService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Check if session already has messages
      if (session.messages && session.messages.length > 0) {
        res.status(400).json({ error: 'Session already has messages' });
        return;
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Send initial connection confirmation
      res.write('data: {"type":"connected"}\n\n');

      try {
        // Check if this is a refresh (user has previous intake data)
        const previousIntakeData = await intakeService.getIntakeData(userId);
        const isRefresh = !!previousIntakeData;

        // Prepare context for initial greeting
        const context = {
          userId,
          sessionId,
          isRefresh,
          previousIntakeData: previousIntakeData || undefined,
        };

        let fullContent = '';

        // Stream the initial AI greeting
        const { fullContent: content, usage } = await streamIntakeResponse(
          [], // Empty messages array for initial greeting
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
              sessionId,
            }
          );

          // Use fallback message instead
          fullContent = getInitialGreetingFallback();
        }

        // Save AI greeting to conversation
        await conversationService.addMessage(sessionId, 'ai', fullContent);

        // Calculate updated progress
        const progress = intakeService.calculateProgress(1);

        // Send completion event with session progress
        const completionData = JSON.stringify({
          type: 'done',
          session: {
            id: sessionId,
            status: 'in_progress',
            currentSection: progress.currentSection,
            completedSections: progress.completedSections,
            messageCount: 1,
          },
          usage: {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cost: usage.totalCost.toFixed(6),
          },
        });
        res.write(`data: ${completionData}\n\n`);
      } catch (error) {
        console.error('Error streaming initial greeting:', error);

        // Send error event
        const errorData = JSON.stringify({
          type: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate initial greeting',
        });
        res.write(`data: ${errorData}\n\n`);
      } finally {
        res.end();
      }
    } catch (error) {
      console.error('Error in intake start endpoint:', error);

      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * Fallback greeting if AI fails
 */
function getInitialGreetingFallback(): string {
  return `Hi there! I'm so glad you're here. I'm looking forward to getting to know you and understanding your relationship better.

Before we dive into any specific issues, I'd like to learn a bit about you. This isn't a test or a form to fill out—just a conversation to help me understand your situation so I can provide more personalized guidance later.

**A few things to know:**
- You can leave anytime and pick up where you left off
- Your responses are private (your partner won't see them)
- You don't need to complete this before addressing a conflict

Let's start simple—what should I call you?`;
}

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
      const { sessionId, content } = req.body;

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

      // Get session - use provided sessionId or get/create one
      let session;
      if (sessionId) {
        session = await conversationService.getSession(sessionId);
        if (!session || session.userId !== userId) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
      } else {
        session = await intakeService.getOrCreateIntakeSession(userId);
      }

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
          sessionId: updatedSession.id,
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

        // Get updated message count for progress calculation
        const finalSession = await conversationService.getSession(session.id);
        const messageCount = finalSession?.messages?.length || 0;
        const progress = intakeService.calculateProgress(messageCount);

        // Send done event with session progress
        const doneData = JSON.stringify({
          type: 'done',
          session: {
            id: session.id,
            status: 'in_progress',
            currentSection: progress.currentSection,
            completedSections: progress.completedSections,
            messageCount,
          },
          usage: {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cost: usage.totalCost.toFixed(6),
          },
        });
        res.write(`data: ${doneData}\n\n`);
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
 * Complete intake conversation (frontend-friendly alias for finalize)
 * POST /api/intake/complete
 *
 * Finalizes the intake session and extracts structured data
 */
router.post(
  '/complete',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const { sessionId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get user's intake session (by sessionId if provided, otherwise latest)
      let session;
      if (sessionId) {
        session = await conversationService.getSession(sessionId);
        if (!session || session.userId !== userId) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
      } else {
        session = await intakeService.getIntakeSession(userId);
      }

      if (!session) {
        res.status(404).json({ error: 'No intake session found' });
        return;
      }

      if (session.status === 'finalized') {
        // Already finalized, just return success
        const intakeData = await intakeService.getIntakeData(userId);
        res.json({
          message: 'Intake already completed',
          data: intakeData,
        });
        return;
      }

      // Finalize and extract data
      const intakeData = await intakeService.finalizeIntake(session.id);

      res.json({
        message: 'Intake completed successfully',
        data: intakeData,
      });
    } catch (error) {
      console.error('Error completing intake:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to complete intake';
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

/**
 * Get intake summary for display
 * GET /api/intake/summary
 *
 * Returns the user's intake data formatted for the summary page
 */
router.get(
  '/summary',
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

      // Format the intake data for the summary page
      const summaryData = {
        summary: intakeData.communication_style_summary || 'Your intake interview has been recorded.',
        extractedData: {
          relationshipDuration: intakeData.relationship_duration,
          goals: intakeData.relationship_goals,
          challenges: intakeData.conflict_triggers,
          communicationStyle: intakeData.communication_style_summary,
          previousTherapy: intakeData.previous_patterns !== 'Not discussed',
        },
        completedAt: intakeData.completed_at,
      };

      res.json(summaryData);
    } catch (error) {
      console.error('Error fetching intake summary:', error);
      res.status(500).json({ error: 'Failed to fetch intake summary' });
    }
  }
);

/**
 * Confirm intake and finalize
 * POST /api/intake/confirm
 *
 * Marks the intake as confirmed by the user
 */
router.post(
  '/confirm',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get the user's intake session
      const session = await intakeService.getIntakeSession(userId);

      if (!session) {
        res.status(404).json({ error: 'No intake session found' });
        return;
      }

      // If not already finalized, finalize it now
      if (session.status !== 'finalized') {
        await intakeService.finalizeIntake(session.id);
      }

      res.json({ message: 'Intake confirmed successfully' });
    } catch (error) {
      console.error('Error confirming intake:', error);
      res.status(500).json({ error: 'Failed to confirm intake' });
    }
  }
);

export default router;
