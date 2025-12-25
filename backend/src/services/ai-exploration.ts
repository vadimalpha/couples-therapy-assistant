import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConversationMessage } from '../types';

/**
 * AI Exploration Service
 *
 * Handles AI-powered exploration chat using Claude API.
 * Generates empathetic, therapeutic responses for relationship exploration.
 */

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Load system prompt from file
const SYSTEM_PROMPT = readFileSync(
  join(__dirname, '../prompts/exploration-system-prompt.txt'),
  'utf-8'
);

// Model configuration
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number; // in USD
}

export interface ExplorationContext {
  userId: string;
  sessionType: string;
  intakeData?: any; // User's intake form data if available
  relationshipContext?: any; // Additional relationship context
}

/**
 * Generate AI response for exploration phase
 * Returns complete response and token usage
 */
export async function generateExplorationResponse(
  messages: ConversationMessage[],
  context: ExplorationContext
): Promise<{ content: string; usage: TokenUsage }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  try {
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Convert messages to Anthropic format
    const anthropicMessages = convertMessages(messages);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Extract text content
    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    // Calculate token usage and cost
    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalCost: calculateCost(
        response.usage.input_tokens,
        response.usage.output_tokens
      ),
    };

    return { content, usage };
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Stream AI response for exploration phase
 * Calls onChunk for each piece of content as it arrives
 */
export async function streamExplorationResponse(
  messages: ConversationMessage[],
  context: ExplorationContext,
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
    console.error('Error streaming AI response:', error);
    throw new Error(
      `Failed to stream AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build system prompt with user context
 */
function buildSystemPrompt(context: ExplorationContext): string {
  let prompt = SYSTEM_PROMPT;

  // Add intake data context if available
  if (context.intakeData) {
    prompt += '\n\nUser Background (from intake):';
    if (context.intakeData.relationshipLength) {
      prompt += `\n- Relationship length: ${context.intakeData.relationshipLength}`;
    }
    if (context.intakeData.mainConcerns) {
      prompt += `\n- Main concerns: ${context.intakeData.mainConcerns}`;
    }
    if (context.intakeData.goals) {
      prompt += `\n- Goals for therapy: ${context.intakeData.goals}`;
    }
  }

  // Add relationship context if available
  if (context.relationshipContext) {
    prompt += '\n\nRelationship Context:';
    prompt += `\n${JSON.stringify(context.relationshipContext, null, 2)}`;
  }

  return prompt;
}

/**
 * Convert ConversationMessage[] to Anthropic message format
 * Only include user and AI messages (filter out partner messages)
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
