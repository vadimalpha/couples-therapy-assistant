import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConversationMessage } from '../types';
import { TokenUsage } from './ai-exploration';

/**
 * AI Intake Service
 *
 * Handles AI-powered intake interview using Claude API.
 * Generates warm, conversational responses for intake sessions.
 */

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Load system prompt from file
const SYSTEM_PROMPT = readFileSync(
  join(__dirname, '../prompts/intake-system-prompt.txt'),
  'utf-8'
);

// Model configuration
const MODEL = 'claude-sonnet-4-20250514';
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
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  try {
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Convert messages to Anthropic format
    const anthropicMessages = convertMessages(messages);

    // Call Claude API with streaming
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    let fullContent = '';

    // Process stream
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        const text = chunk.delta.text;
        fullContent += text;
        onChunk(text);
      }
    }

    // Get final message with usage
    const finalMessage = await stream.finalMessage();

    // Calculate token usage and cost
    const usage: TokenUsage = {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
      totalCost: calculateCost(
        finalMessage.usage.input_tokens,
        finalMessage.usage.output_tokens
      ),
    };

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
 * Convert ConversationMessage[] to Anthropic message format
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
 * Pricing for Claude Sonnet 4 (as of Dec 2024):
 * - Input: $3 per million tokens
 * - Output: $15 per million tokens
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_MILLION = 3.0;
  const OUTPUT_COST_PER_MILLION = 15.0;

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return inputCost + outputCost;
}

/**
 * Validate that API key is configured
 */
export function validateApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
