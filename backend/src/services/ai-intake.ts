import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConversationMessage } from '../types';
import { TokenUsage } from './chat-ai';

/**
 * AI Intake Service
 *
 * Handles AI-powered intake interview using OpenAI GPT-5.2.
 * Generates warm, conversational responses for intake sessions.
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Load system prompt from file
const SYSTEM_PROMPT = readFileSync(
  join(__dirname, '../prompts/intake-system-prompt.txt'),
  'utf-8'
);

// Model configuration
const MODEL = 'gpt-5.2';
const MAX_TOKENS = 1024;

export interface IntakeContext {
  userId: string;
  isRefresh?: boolean; // True if this is a quarterly refresh
  previousIntakeData?: any; // Previous intake data if doing refresh
}

/**
 * Stream AI response for intake interview
 * Calls onChunk for each piece of content as it arrives
 */
export async function streamIntakeResponse(
  messages: ConversationMessage[],
  context: IntakeContext,
  onChunk: (chunk: string) => void
): Promise<{ fullContent: string; usage: TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Convert messages to OpenAI format
    const openaiMessages = convertMessages(messages);

    // Call OpenAI API with streaming
    const stream = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ],
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullContent = '';
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalCost: 0 };

    // Process stream
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        onChunk(delta);
      }

      // Capture usage from final chunk
      if (chunk.usage) {
        usage = {
          inputTokens: chunk.usage.prompt_tokens || 0,
          outputTokens: chunk.usage.completion_tokens || 0,
          totalCost: calculateCost(
            chunk.usage.prompt_tokens || 0,
            chunk.usage.completion_tokens || 0
          ),
        };
      }
    }

    return { fullContent, usage };
  } catch (error) {
    console.error('Error streaming intake response:', error);
    throw new Error(
      `Failed to stream intake response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build system prompt with context
 */
function buildSystemPrompt(context: IntakeContext): string {
  let prompt = SYSTEM_PROMPT;

  // Add refresh context if applicable
  if (context.isRefresh && context.previousIntakeData) {
    prompt += '\n\nIMPORTANT: This is a quarterly refresh conversation.';
    prompt += '\nPrevious intake data:';
    prompt += `\n- Name: ${context.previousIntakeData.name}`;
    prompt += `\n- Relationship duration: ${context.previousIntakeData.relationship_duration}`;
    prompt += `\n- Previous goals: ${context.previousIntakeData.relationship_goals?.join(', ') || 'None specified'}`;
    prompt += '\n\nAcknowledge that you remember them and ask how things have been going since last time.';
    prompt += '\nFocus on what has changed, what progress they\'ve made, and if their goals have evolved.';
  }

  return prompt;
}

/**
 * Convert ConversationMessage[] to OpenAI message format
 * Only include user and AI messages
 */
function convertMessages(
  messages: ConversationMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((msg) => msg.role === 'user' || msg.role === 'ai')
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}

/**
 * Calculate cost based on token usage
 * Pricing for GPT-5.2 (estimated):
 * - Input: $2.50 per million tokens
 * - Output: $10 per million tokens
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_MILLION = 2.5;
  const OUTPUT_COST_PER_MILLION = 10.0;

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return inputCost + outputCost;
}

/**
 * Validate that API key is configured
 */
export function validateApiKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
