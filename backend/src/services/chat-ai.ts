import openai from './openai-client';
import { getDatabase } from './db';

/**
 * Chat AI Service
 *
 * Handles AI-powered chat using OpenAI GPT-5.2 (or GPT-4o fallback).
 * Provides streaming responses with token usage tracking and cost monitoring.
 */

// Model configuration
const PRIMARY_MODEL = 'gpt-5.2';
const FALLBACK_MODEL = 'gpt-4o';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// GPT-5.2 Pricing (per million tokens)
const INPUT_COST_PER_MILLION = 1.75;
const OUTPUT_COST_PER_MILLION = 14.0;

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalCost: number; // in USD
}

/**
 * Stream AI response for chat
 * Yields chunks of text as they arrive from OpenAI
 * Returns token usage after stream completes
 */
export async function* respondToMessage(
  sessionId: string,
  userMessage: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): AsyncGenerator<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Build messages array
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < MAX_RETRIES) {
    try {
      // Try primary model first, fallback to secondary on first attempt failure
      const model = attempt === 0 ? PRIMARY_MODEL : FALLBACK_MODEL;

      const stream = await openai.chat.completions.create({
        model,
        messages,
        stream: true,
        temperature: 0.7,
      });

      let fullContent = '';
      let promptTokens = 0;
      let completionTokens = 0;

      // Stream chunks to caller
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          yield delta;
        }

        // Capture token usage if available (usually in final chunk)
        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens || 0;
          completionTokens = chunk.usage.completion_tokens || 0;
        }
      }

      // Log token usage to database
      await logTokenUsage(sessionId, model, promptTokens, completionTokens);

      // Successfully completed
      return;
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (429)
      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        attempt++;
        if (attempt < MAX_RETRIES) {
          console.log(
            `Rate limit hit. Retrying in ${RETRY_DELAY_MS}ms (attempt ${attempt}/${MAX_RETRIES})`
          );
          await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
          continue;
        }
      }

      // For other errors, don't retry
      console.error('Error in respondToMessage:', error);
      throw new Error(
        `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // All retries exhausted
  throw new Error(
    `Failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Rate limit exceeded'}`
  );
}

/**
 * Log token usage to SurrealDB for cost monitoring
 */
async function logTokenUsage(
  sessionId: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  try {
    const db = getDatabase();

    // Calculate cost
    const totalCost = calculateCost(promptTokens, completionTokens);

    // Store in token_usage table
    await db.query(
      `
      CREATE token_usage CONTENT {
        session_id: $sessionId,
        model: $model,
        prompt_tokens: $promptTokens,
        completion_tokens: $completionTokens,
        total_cost: $totalCost,
        timestamp: time::now()
      }
    `,
      {
        sessionId,
        model,
        promptTokens,
        completionTokens,
        totalCost,
      }
    );

    console.log(
      `Token usage logged: ${promptTokens} input + ${completionTokens} output = $${totalCost.toFixed(4)}`
    );
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log token usage:', error);
  }
}

/**
 * Calculate cost based on token usage
 * Pricing for GPT-5.2:
 * - Input: $1.75 per million tokens
 * - Output: $14 per million tokens
 */
function calculateCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (completionTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return inputCost + outputCost;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate that API key is configured
 */
export function validateApiKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
