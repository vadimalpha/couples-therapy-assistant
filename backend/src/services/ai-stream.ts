/**
 * AI Streaming Service
 *
 * This is a placeholder implementation for AI response streaming.
 * The actual LLM integration will be implemented in Task #16.
 *
 * For now, this provides a mock streaming response for testing the
 * infrastructure.
 */

export interface StreamChunk {
  content: string;
  isComplete: boolean;
}

export type StreamCallback = (chunk: StreamChunk) => void;

/**
 * Mock AI streaming response
 * Simulates streaming by sending chunks of a pre-defined response
 */
export async function streamResponse(
  sessionId: string,
  userMessage: string,
  onChunk: StreamCallback
): Promise<void> {
  // Mock response that will be streamed
  const mockResponse = `Thank you for sharing that with me. I understand you're working through some challenges in your relationship. Let me help you explore this further.

Based on what you've told me, it sounds like communication is a key area where you're experiencing difficulties. This is actually quite common in relationships, and it's wonderful that you're taking steps to address it.

Can you tell me more about a specific situation where you felt the communication wasn't working well? Understanding the context will help me provide more tailored guidance.`;

  // Split response into words for realistic streaming
  const words = mockResponse.split(' ');

  // Stream chunks with realistic timing
  for (let i = 0; i < words.length; i++) {
    const chunk = words[i];
    const isComplete = i === words.length - 1;

    // Add space between words (except for last word)
    const content = isComplete ? chunk : chunk + ' ';

    // Send chunk
    onChunk({
      content,
      isComplete
    });

    // Simulate realistic AI generation delay (30-80ms per word)
    const delay = 30 + Math.random() * 50;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Stream a response using Server-Sent Events
 * This function is designed to be used with Express Response object
 */
export async function streamResponseSSE(
  sessionId: string,
  userMessage: string,
  res: any // Express Response type
): Promise<void> {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection confirmation
  res.write('data: {"type":"connected"}\n\n');

  try {
    // Stream the response
    await streamResponse(sessionId, userMessage, (chunk) => {
      const data = JSON.stringify({
        type: chunk.isComplete ? 'complete' : 'chunk',
        content: chunk.content,
        sessionId
      });

      res.write(`data: ${data}\n\n`);
    });

    // Send completion event
    res.write('data: {"type":"done"}\n\n');

  } catch (error) {
    // Send error event
    const errorData = JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.write(`data: ${errorData}\n\n`);
  } finally {
    // Close the connection
    res.end();
  }
}

/**
 * Validate session before streaming
 * This will be implemented properly when database integration is complete
 */
export async function validateSession(sessionId: string): Promise<boolean> {
  // Placeholder: Always return true for now
  // TODO: Implement actual session validation with SurrealDB in Task #16
  return true;
}

/**
 * Save AI response to conversation history
 * This will be implemented when database integration is complete
 */
export async function saveAIResponse(
  sessionId: string,
  content: string
): Promise<void> {
  // Placeholder: Log for now
  console.log(`[AI Response] Session ${sessionId}: ${content.substring(0, 50)}...`);
  // TODO: Implement actual database save in Task #16
}
