import OpenAI from 'openai';
import { ConversationMessage, SessionType } from '../types';
import { buildPrompt } from './prompt-builder';
import { conversationService } from './conversation';
import { conflictService } from './conflict';
import { getUserById } from './user';
import { MODEL } from './chat-ai';

/**
 * AI Orchestrator Service
 *
 * Orchestrates AI responses for different session types, including the relationship_shared
 * session type where both partners engage in a shared conversation.
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

// Token configuration (MODEL imported from chat-ai.ts)
const MAX_COMPLETION_TOKENS = 1536; // Increased for couples dialogue
const SYNTHESIS_MAX_TOKENS = 2048; // For initial synthesis

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number; // in USD
}

export interface RelationshipContext {
  sessionId: string;
  conflictId: string;
  partnerAId: string;
  partnerBId: string;
  senderId?: string; // ID of the partner who sent the current message
}

/**
 * Generate initial synthesis message for relationship_shared session
 * This is called when the shared session first begins
 */
export async function generateRelationshipSynthesis(
  context: RelationshipContext
): Promise<{ content: string; usage: TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Get conflict and verify both partners have completed exploration
    const conflict = await conflictService.getConflict(context.conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    if (!conflict.partner_a_session_id || !conflict.partner_b_session_id) {
      throw new Error('Both partners must complete exploration before starting shared session');
    }

    // Get both partners' exploration sessions
    const partnerAExploration = await conversationService.getSession(
      conflict.partner_a_session_id
    );
    const partnerBExploration = await conversationService.getSession(
      conflict.partner_b_session_id
    );

    if (!partnerAExploration || !partnerBExploration) {
      throw new Error('Could not retrieve partner exploration sessions');
    }

    if (
      partnerAExploration.status !== 'finalized' ||
      partnerBExploration.status !== 'finalized'
    ) {
      throw new Error('Both partners must finalize exploration sessions first');
    }

    // Get both partners' user data and previous guidance
    const partnerAUser = await getUserById(context.partnerAId);
    const partnerBUser = await getUserById(context.partnerBId);

    const partnerAGuidance = await getPartnerGuidance(context.partnerAId, context.conflictId);
    const partnerBGuidance = await getPartnerGuidance(context.partnerBId, context.conflictId);

    // Build system prompt with RAG and pattern context
    const systemPrompt = await buildPrompt('relationship-synthesis.txt', {
      conflictId: context.conflictId,
      userId: context.partnerAId, // Use either partner for context loading
      sessionType: 'relationship_shared',
      includeRAG: true,
      includePatterns: true,
    });

    // Build context for synthesis
    const synthesisContext = buildRelationshipSynthesisContext(
      partnerAExploration.messages,
      partnerBExploration.messages,
      partnerAGuidance,
      partnerBGuidance,
      partnerAUser?.displayName,
      partnerBUser?.displayName,
      conflict.title
    );

    // Call OpenAI API
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: SYNTHESIS_MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: synthesisContext },
      ],
    });

    // Extract text content
    const content = response.choices[0]?.message?.content || '';

    // Calculate token usage
    const usage: TokenUsage = {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalCost: calculateCost(
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0
      ),
    };

    // Log token usage for monitoring
    console.log(
      `Relationship synthesis - Conflict: ${context.conflictId}, Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}, Cost: $${usage.totalCost.toFixed(4)}`
    );

    return { content, usage };
  } catch (error) {
    console.error('Error generating relationship synthesis:', error);
    throw new Error(
      `Failed to generate relationship synthesis: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate AI response for ongoing relationship_shared conversation
 * Takes into account who sent the message (senderId)
 */
export async function generateRelationshipResponse(
  messages: ConversationMessage[],
  context: RelationshipContext
): Promise<{ content: string; usage: TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Get partner names for context
    const partnerAUser = await getUserById(context.partnerAId);
    const partnerBUser = await getUserById(context.partnerBId);

    // Build system prompt with RAG and pattern context
    const systemPrompt = await buildPrompt('relationship-chat.txt', {
      conflictId: context.conflictId,
      userId: context.partnerAId, // Use either partner for context loading
      sessionType: 'relationship_shared',
      includeRAG: true,
      includePatterns: true,
    });

    // Add sender context to system prompt
    const enrichedSystemPrompt = buildSystemPromptWithSenderContext(
      systemPrompt,
      partnerAUser?.displayName,
      partnerBUser?.displayName
    );

    // Convert messages to OpenAI format with sender information
    const openaiMessages = convertRelationshipMessages(
      messages,
      context.partnerAId,
      context.partnerBId,
      partnerAUser?.displayName,
      partnerBUser?.displayName
    );

    // Call OpenAI API
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: enrichedSystemPrompt },
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

    // Log token usage for monitoring
    console.log(
      `Relationship chat - Session: ${context.sessionId}, Sender: ${context.senderId || 'unknown'}, Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}, Cost: $${usage.totalCost.toFixed(4)}`
    );

    return { content, usage };
  } catch (error) {
    console.error('Error generating relationship response:', error);
    throw new Error(
      `Failed to generate relationship response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Stream AI response for ongoing relationship_shared conversation
 */
export async function streamRelationshipResponse(
  messages: ConversationMessage[],
  context: RelationshipContext,
  onChunk: (chunk: string) => void
): Promise<{ fullContent: string; usage: TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Get partner names for context
    const partnerAUser = await getUserById(context.partnerAId);
    const partnerBUser = await getUserById(context.partnerBId);

    // Build system prompt with RAG and pattern context
    const systemPrompt = await buildPrompt('relationship-chat.txt', {
      conflictId: context.conflictId,
      userId: context.partnerAId,
      sessionType: 'relationship_shared',
      includeRAG: true,
      includePatterns: true,
    });

    // Add sender context to system prompt
    const enrichedSystemPrompt = buildSystemPromptWithSenderContext(
      systemPrompt,
      partnerAUser?.displayName,
      partnerBUser?.displayName
    );

    // Convert messages to OpenAI format with sender information
    const openaiMessages = convertRelationshipMessages(
      messages,
      context.partnerAId,
      context.partnerBId,
      partnerAUser?.displayName,
      partnerBUser?.displayName
    );

    // Call OpenAI API with streaming
    const stream = await getOpenAI().chat.completions.create({
      model: MODEL,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: enrichedSystemPrompt },
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

    // Log token usage for monitoring
    console.log(
      `Relationship chat (stream) - Session: ${context.sessionId}, Sender: ${context.senderId || 'unknown'}, Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}, Cost: $${usage.totalCost.toFixed(4)}`
    );

    return { fullContent, usage };
  } catch (error) {
    console.error('Error streaming relationship response:', error);
    throw new Error(
      `Failed to stream relationship response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build context for relationship synthesis (initial message)
 */
function buildRelationshipSynthesisContext(
  partnerAMessages: ConversationMessage[],
  partnerBMessages: ConversationMessage[],
  partnerAGuidance: string | null,
  partnerBGuidance: string | null,
  partnerAName?: string,
  partnerBName?: string,
  conflictTitle?: string
): string {
  let context = 'You are about to begin a shared relationship conversation with both partners.\n\n';

  if (conflictTitle) {
    context += `The situation they want to explore together: ${conflictTitle}\n\n`;
  }

  // Add Partner A's exploration
  context += `--- ${partnerAName || 'PARTNER A'}'S EXPLORATION CONVERSATION ---\n\n`;
  partnerAMessages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

  // Add Partner A's guidance if available
  if (partnerAGuidance) {
    context += `--- GUIDANCE PROVIDED TO ${partnerAName || 'PARTNER A'} ---\n\n`;
    context += `${partnerAGuidance}\n\n`;
  }

  // Add Partner B's exploration
  context += `--- ${partnerBName || 'PARTNER B'}'S EXPLORATION CONVERSATION ---\n\n`;
  partnerBMessages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

  // Add Partner B's guidance if available
  if (partnerBGuidance) {
    context += `--- GUIDANCE PROVIDED TO ${partnerBName || 'PARTNER B'} ---\n\n`;
    context += `${partnerBGuidance}\n\n`;
  }

  context += `Please create a warm, welcoming initial message that brings both partners together. Acknowledge what you heard from each of them, highlight areas of alignment and divergence, and invite them into constructive dialogue. Remember to address them as a couple and set a hopeful, collaborative tone.`;

  return context;
}

/**
 * Add sender context to system prompt
 */
function buildSystemPromptWithSenderContext(
  basePrompt: string,
  partnerAName?: string,
  partnerBName?: string
): string {
  let prompt = basePrompt;

  prompt += '\n\n## Partner Information\n';
  prompt += `Partner A: ${partnerAName || 'Not provided'}\n`;
  prompt += `Partner B: ${partnerBName || 'Not provided'}\n\n`;
  prompt += 'Each message will include sender information so you know which partner is speaking.\n';
  prompt += 'Always address BOTH partners in your responses, not just the one who sent the message.\n';

  return prompt;
}

/**
 * Convert relationship messages to OpenAI format
 * Includes sender information in message content
 */
function convertRelationshipMessages(
  messages: ConversationMessage[],
  partnerAId: string,
  partnerBId: string,
  partnerAName?: string,
  partnerBName?: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((msg) => {
    if (msg.role === 'ai') {
      return {
        role: 'assistant' as const,
        content: msg.content,
      };
    } else {
      // Determine which partner sent this message
      const isPartnerA = msg.senderId === partnerAId;
      const senderName = isPartnerA
        ? partnerAName || 'Partner A'
        : partnerBName || 'Partner B';

      // Include sender information in the content
      return {
        role: 'user' as const,
        content: `[Message from ${senderName}]\n${msg.content}`,
      };
    }
  });
}

/**
 * Get previous guidance messages for a partner
 */
async function getPartnerGuidance(
  partnerId: string,
  conflictId: string
): Promise<string | null> {
  try {
    const sessions = await conversationService.getUserSessions(partnerId);

    // Find joint_context session for this conflict
    const jointContextSession = sessions.find(
      (s) =>
        (s.sessionType === 'joint_context_a' || s.sessionType === 'joint_context_b') &&
        s.conflictId === conflictId &&
        s.messages.length > 0
    );

    if (!jointContextSession) {
      return null;
    }

    // Get the first AI message (the guidance synthesis)
    const guidanceMessage = jointContextSession.messages.find(
      (msg) => msg.role === 'ai'
    );

    return guidanceMessage?.content || null;
  } catch (error) {
    console.error('Error getting partner guidance:', error);
    return null;
  }
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
