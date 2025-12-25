import { Router, Request, Response } from 'express';
import { streamResponseSSE, validateSession, saveAIResponse } from '../services/ai-stream';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * GET /api/conversations/:id/stream
 * Server-Sent Events endpoint for AI response streaming
 *
 * This endpoint establishes a long-lived connection and streams
 * AI responses as they are generated.
 */
router.get(
  '/conversations/:id/stream',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const sessionId = req.params.id;
    const userMessage = req.query.message as string;

    if (!userMessage) {
      return res.status(400).json({
        error: 'Message parameter is required'
      });
    }

    try {
      // Validate session exists and user has access
      const isValid = await validateSession(sessionId);
      if (!isValid) {
        return res.status(404).json({
          error: 'Conversation session not found or access denied'
        });
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Keep connection alive with periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 30000); // Every 30 seconds

      // Handle client disconnect
      req.on('close', () => {
        clearInterval(heartbeatInterval);
        console.log(`Client disconnected from stream: ${sessionId}`);
      });

      // Collect the full response for saving
      let fullResponse = '';

      // Send initial connection confirmation
      res.write('data: {"type":"connected","sessionId":"' + sessionId + '"}\n\n');

      // Stream the AI response
      await streamResponseSSE(
        sessionId,
        userMessage,
        {
          setHeader: () => {}, // Already set headers
          write: (data: string) => {
            // Extract content from SSE data for saving
            if (data.startsWith('data: ')) {
              try {
                const jsonStr = data.substring(6, data.length - 2);
                const parsed = JSON.parse(jsonStr);
                if (parsed.type === 'chunk' || parsed.type === 'complete') {
                  fullResponse += parsed.content;
                }
              } catch (e) {
                // Ignore parsing errors for heartbeats
              }
            }
            res.write(data);
          },
          end: () => {
            clearInterval(heartbeatInterval);
            res.end();
          }
        }
      );

      // Save the complete response to database
      if (fullResponse) {
        await saveAIResponse(sessionId, fullResponse);
      }

    } catch (error) {
      console.error('Error in stream endpoint:', error);

      // Send error event
      const errorData = JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Internal server error'
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    }
  }
);

/**
 * POST /api/conversations/:id/stream
 * Alternative POST endpoint for streaming when GET with body is not preferred
 */
router.post(
  '/conversations/:id/stream',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const sessionId = req.params.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required in request body'
      });
    }

    try {
      // Validate session
      const isValid = await validateSession(sessionId);
      if (!isValid) {
        return res.status(404).json({
          error: 'Conversation session not found or access denied'
        });
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Keep connection alive with periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 30000);

      // Handle client disconnect
      req.on('close', () => {
        clearInterval(heartbeatInterval);
        console.log(`Client disconnected from stream: ${sessionId}`);
      });

      // Collect full response
      let fullResponse = '';

      // Send connection confirmation
      res.write('data: {"type":"connected","sessionId":"' + sessionId + '"}\n\n');

      // Stream response
      await streamResponseSSE(
        sessionId,
        message,
        {
          setHeader: () => {},
          write: (data: string) => {
            if (data.startsWith('data: ')) {
              try {
                const jsonStr = data.substring(6, data.length - 2);
                const parsed = JSON.parse(jsonStr);
                if (parsed.type === 'chunk' || parsed.type === 'complete') {
                  fullResponse += parsed.content;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
            res.write(data);
          },
          end: () => {
            clearInterval(heartbeatInterval);
            res.end();
          }
        }
      );

      // Save response
      if (fullResponse) {
        await saveAIResponse(sessionId, fullResponse);
      }

    } catch (error) {
      console.error('Error in stream endpoint:', error);

      const errorData = JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Internal server error'
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    }
  }
);

export default router;
