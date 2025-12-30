import OpenAI from 'openai';
import { ConversationMessage } from '../types';
import { buildPrompt } from './prompt-builder';

/**
 * AI Exploration Service
 *
 * Handles AI-powered exploration chat using OpenAI GPT-5.2 API.
 * Generates empathetic, therapeutic responses for relationship exploration.
 */

// Lazy-initialized OpenAI client
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }
  return openai;
}

// Model configuration
const MODEL = 'gpt-5-2';
const MAX_COMPLETION_TOKENS = 1024;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number; // in USD
}

export interface ExplorationContext {
  userId: string;
  conflictId?: string;
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
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Build system prompt with RAG context if available
    let systemPrompt: string;
    if (context.conflictId) {
      systemPrompt = await buildPrompt('exploration-system-prompt.txt', {
        conflictId: context.conflictId,
        userId: context.userId,
        sessionType: context.sessionType as any,
        includeRAG: true,
        includePatterns: false,
      });
    } else {
      systemPrompt = await buildPrompt('exploration-system-prompt.txt', {
        conflictId: '',
        userId: context.userId,
        sessionType: context.sessionType as any,
        includeRAG: false,
        includePatterns: false,
      });
    }

    // Add additional context
    systemPrompt = buildSystemPromptWithContext(systemPrompt, context);

    // Convert messages to OpenAI format
    const openaiMessages = convertMessages(messages);

    // Call OpenAI API
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ],
    });

    // Extract text content
    const content = response.choices[0]?.message?.content || '';

    // Calculate token usage and cost
    const usage: TokenUsage = {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalCost: calculateCost(
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0
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
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Build system prompt with RAG context if available
    let systemPrompt: string;
    if (context.conflictId) {
      systemPrompt = await buildPrompt('exploration-system-prompt.txt', {
        conflictId: context.conflictId,
        userId: context.userId,
        sessionType: context.sessionType as any,
        includeRAG: true,
        includePatterns: false,
      });
    } else {
      systemPrompt = await buildPrompt('exploration-system-prompt.txt', {
        conflictId: '',
        userId: context.userId,
        sessionType: context.sessionType as any,
        includeRAG: false,
        includePatterns: false,
      });
    }

    // Add additional context
    systemPrompt = buildSystemPromptWithContext(systemPrompt, context);

    // Convert messages to OpenAI format
    const openaiMessages = convertMessages(messages);

    // Call OpenAI API with streaming
    const stream = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
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
    console.error('Error streaming AI response:', error);
    throw new Error(
      `Failed to stream AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build system prompt with user context
 * Adds intake data and relationship context to the base prompt
 */
function buildSystemPromptWithContext(basePrompt: string, context: ExplorationContext): string {
  let prompt = basePrompt;

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
 * Convert ConversationMessage[] to OpenAI message format
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
