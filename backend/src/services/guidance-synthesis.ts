import OpenAI from 'openai';
import { ConversationMessage, ConversationSession } from '../types';
import { conversationService } from './conversation';
import { conflictService } from './conflict';
import { getUserById } from './user';
import { buildPrompt } from './prompt-builder';
import { logPrompt } from './prompt-logger';

/**
 * Guidance Synthesis Service
 *
 * Handles synthesis of personalized guidance from exploration conversations.
 * Supports both individual guidance (single partner) and joint-context guidance (both partners).
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Model configuration
const MODEL = 'gpt-4o';
const INDIVIDUAL_MAX_TOKENS = 2048;
const JOINT_CONTEXT_MAX_TOKENS = 3072;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number; // in USD
}

export interface GuidanceSynthesisResult {
  guidance: string;
  usage: TokenUsage;
  sessionId: string;
}

/**
 * Synthesize individual guidance from a single partner's exploration session
 * Creates a new joint_context session and adds the guidance as the first AI message
 */
export async function synthesizeIndividualGuidance(
  explorationSessionId: string
): Promise<GuidanceSynthesisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Get the exploration session
    const explorationSession = await conversationService.getSession(explorationSessionId);
    if (!explorationSession) {
      throw new Error('Exploration session not found');
    }

    if (explorationSession.status !== 'finalized') {
      throw new Error('Exploration session must be finalized before synthesizing guidance');
    }

    // Determine which partner this is (A or B)
    const isPartnerA = explorationSession.sessionType === 'individual_a';
    const jointContextSessionType = isPartnerA ? 'joint_context_a' : 'joint_context_b';

    // Get user's intake data if available
    const user = await getUserById(explorationSession.userId);
    const intakeData = await getIntakeData(explorationSession.userId);

    // Get conflict to determine guidance mode
    const conflict = explorationSession.conflictId
      ? await conflictService.getConflict(explorationSession.conflictId)
      : null;

    // Build system prompt with RAG context
    const systemPrompt = await buildPrompt('individual-guidance-prompt.txt', {
      conflictId: explorationSession.conflictId || '',
      userId: explorationSession.userId,
      sessionType: explorationSession.sessionType,
      includeRAG: !!explorationSession.conflictId,
      includePatterns: false,
      guidanceMode: conflict?.guidance_mode || 'conversational',
    });

    // Build context for synthesis
    const context = buildIndividualContext(
      explorationSession.messages,
      intakeData,
      user?.displayName
    );

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: INDIVIDUAL_MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context },
      ],
    });

    // Extract text content
    const guidance = response.choices[0]?.message?.content || '';

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
      `Individual guidance synthesis - User: ${explorationSession.userId}, Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}, Cost: $${usage.totalCost.toFixed(4)}`
    );

    // Log the prompt
    logPrompt({
      userId: explorationSession.userId,
      userEmail: user?.email,
      userName: user?.displayName,
      conflictId: explorationSession.conflictId,
      conflictTitle: conflict?.title,
      sessionId: explorationSessionId,
      sessionType: explorationSession.sessionType,
      logType: 'individual_guidance',
      guidanceMode: conflict?.guidance_mode,
      systemPrompt,
      userMessage: context,
      aiResponse: guidance,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.totalCost,
    });

    // Create new joint_context session
    const jointContextSession = await conversationService.createSession(
      explorationSession.userId,
      jointContextSessionType,
      explorationSession.conflictId
    );

    // Add guidance as first AI message in the new session
    await conversationService.addMessage(
      jointContextSession.id,
      'ai',
      guidance
    );

    return {
      guidance,
      usage,
      sessionId: jointContextSession.id,
    };
  } catch (error) {
    console.error('Error synthesizing individual guidance:', error);
    throw new Error(
      `Failed to synthesize individual guidance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Synthesize joint-context guidance incorporating BOTH partners' perspectives
 * Adds the guidance as an AI message to the existing joint_context session
 */
export async function synthesizeJointContextGuidance(
  conflictId: string,
  partnerId: string
): Promise<GuidanceSynthesisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Get the conflict
    const conflict = await conflictService.getConflict(conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    // Verify both partners have finalized their exploration sessions
    if (!conflict.partner_a_session_id || !conflict.partner_b_session_id) {
      throw new Error('Both partners must have exploration sessions');
    }

    const partnerASession = await conversationService.getSession(
      conflict.partner_a_session_id
    );
    const partnerBSession = await conversationService.getSession(
      conflict.partner_b_session_id
    );

    if (!partnerASession || !partnerBSession) {
      throw new Error('Could not retrieve partner exploration sessions');
    }

    if (
      partnerASession.status !== 'finalized' ||
      partnerBSession.status !== 'finalized'
    ) {
      throw new Error('Both partners must finalize their exploration sessions first');
    }

    // Determine which partner is requesting guidance
    const isPartnerA = partnerId === conflict.partner_a_id;
    const requestingPartner = isPartnerA ? partnerASession : partnerBSession;
    const otherPartner = isPartnerA ? partnerBSession : partnerASession;

    // Get both users' data
    const requestingUser = await getUserById(partnerId);
    const otherUserId = isPartnerA ? conflict.partner_b_id : conflict.partner_a_id;
    const otherUser = otherUserId ? await getUserById(otherUserId) : null;

    // Get intake data for both partners
    const requestingIntakeData = await getIntakeData(partnerId);
    const otherIntakeData = otherUserId ? await getIntakeData(otherUserId) : null;

    // Build system prompt with RAG and pattern context
    const systemPrompt = await buildPrompt('joint-context-synthesis.txt', {
      conflictId,
      userId: partnerId,
      sessionType: isPartnerA ? 'joint_context_a' : 'joint_context_b',
      includeRAG: true,
      includePatterns: true,
      guidanceMode: conflict.guidance_mode || 'conversational',
    });

    // Build context for joint synthesis
    const context = buildJointContext(
      requestingPartner.messages,
      otherPartner.messages,
      requestingIntakeData,
      otherIntakeData,
      requestingUser?.displayName,
      otherUser?.displayName
    );

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: JOINT_CONTEXT_MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context },
      ],
    });

    // Extract text content
    const guidance = response.choices[0]?.message?.content || '';

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
      `Joint-context guidance synthesis - Conflict: ${conflictId}, Partner: ${partnerId}, Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}, Cost: $${usage.totalCost.toFixed(4)}`
    );

    // Log the prompt
    logPrompt({
      userId: partnerId,
      userEmail: requestingUser?.email,
      userName: requestingUser?.displayName,
      conflictId,
      conflictTitle: conflict.title,
      sessionType: isPartnerA ? 'joint_context_a' : 'joint_context_b',
      logType: 'joint_context_guidance',
      guidanceMode: conflict.guidance_mode,
      systemPrompt,
      userMessage: context,
      aiResponse: guidance,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.totalCost,
    });

    // Find or create the requesting partner's joint_context session
    const jointContextSessionType = isPartnerA ? 'joint_context_a' : 'joint_context_b';
    const existingSessions = await conversationService.getUserSessions(partnerId);
    let jointContextSession = existingSessions.find(
      (s) =>
        s.sessionType === jointContextSessionType &&
        s.conflictId === conflictId
    );

    // If session doesn't exist, create it
    if (!jointContextSession) {
      jointContextSession = await conversationService.createSession(
        partnerId,
        jointContextSessionType,
        conflictId
      );
    }

    // Add guidance as AI message to the joint_context session
    await conversationService.addMessage(
      jointContextSession.id,
      'ai',
      guidance
    );

    return {
      guidance,
      usage,
      sessionId: jointContextSession.id,
    };
  } catch (error) {
    console.error('Error synthesizing joint-context guidance:', error);
    throw new Error(
      `Failed to synthesize joint-context guidance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build context string for individual guidance synthesis
 */
function buildIndividualContext(
  messages: ConversationMessage[],
  intakeData: any,
  userName?: string
): string {
  let context = 'Below is the exploration conversation with this individual:\n\n';

  // Add conversation history
  context += '--- EXPLORATION CONVERSATION ---\n\n';
  messages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

  // Add intake data if available
  if (intakeData) {
    context += '--- USER BACKGROUND (from intake) ---\n\n';
    if (intakeData.relationshipLength) {
      context += `Relationship length: ${intakeData.relationshipLength}\n`;
    }
    if (intakeData.mainConcerns) {
      context += `Main concerns: ${intakeData.mainConcerns}\n`;
    }
    if (intakeData.goals) {
      context += `Goals for therapy: ${intakeData.goals}\n`;
    }
    context += '\n';
  }

  // Add user name if available
  if (userName) {
    context += `User's name: ${userName}\n\n`;
  }

  context += `Please synthesize personalized guidance based on this exploration conversation. Draw directly from what was shared, validate their experience, identify key themes, and offer warm, actionable suggestions. End with an invitation for continued dialogue.`;

  return context;
}

/**
 * Build context string for joint-context guidance synthesis
 */
function buildJointContext(
  requestingPartnerMessages: ConversationMessage[],
  otherPartnerMessages: ConversationMessage[],
  requestingIntakeData: any,
  otherIntakeData: any,
  requestingPartnerName?: string,
  otherPartnerName?: string
): string {
  let context = '';

  // Add context about who is receiving this guidance
  context += `This guidance is being prepared for: ${requestingPartnerName || 'Partner A'}\n\n`;

  // Add requesting partner's conversation
  context += `--- ${requestingPartnerName || 'PARTNER A'}'S EXPLORATION CONVERSATION ---\n\n`;
  requestingPartnerMessages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

  // Add requesting partner's intake data if available
  if (requestingIntakeData) {
    context += `--- ${requestingPartnerName || 'PARTNER A'}'S BACKGROUND (from intake) ---\n\n`;
    if (requestingIntakeData.relationshipLength) {
      context += `Relationship length: ${requestingIntakeData.relationshipLength}\n`;
    }
    if (requestingIntakeData.mainConcerns) {
      context += `Main concerns: ${requestingIntakeData.mainConcerns}\n`;
    }
    if (requestingIntakeData.goals) {
      context += `Goals for therapy: ${requestingIntakeData.goals}\n`;
    }
    context += '\n';
  }

  // Add other partner's conversation
  context += `--- ${otherPartnerName || 'PARTNER B'}'S EXPLORATION CONVERSATION ---\n\n`;
  otherPartnerMessages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

  // Add other partner's intake data if available
  if (otherIntakeData) {
    context += `--- ${otherPartnerName || 'PARTNER B'}'S BACKGROUND (from intake) ---\n\n`;
    if (otherIntakeData.relationshipLength) {
      context += `Relationship length: ${otherIntakeData.relationshipLength}\n`;
    }
    if (otherIntakeData.mainConcerns) {
      context += `Main concerns: ${otherIntakeData.mainConcerns}\n`;
    }
    if (otherIntakeData.goals) {
      context += `Goals for therapy: ${otherIntakeData.goals}\n`;
    }
    context += '\n';
  }

  context += `Please synthesize personalized guidance for ${requestingPartnerName || 'Partner A'} that incorporates both partners' perspectives. Identify patterns across both conversations, areas of alignment and difference, and provide insights that help this partner understand both their own experience and their partner's perspective. Suggest communication approaches that bridge the gap.`;

  return context;
}

/**
 * Get intake data for a user
 * Returns null if no intake session exists or data is not available
 */
async function getIntakeData(userId: string): Promise<any | null> {
  try {
    const sessions = await conversationService.getUserSessions(userId);
    const intakeSession = sessions.find((s) => s.sessionType === 'intake');

    if (!intakeSession || !intakeSession.messages.length) {
      return null;
    }

    // Try to extract structured data from intake messages
    // This is a simplified approach - actual implementation would depend on intake format
    const intakeData: any = {};

    // Look for specific patterns in messages
    intakeSession.messages.forEach((msg) => {
      if (msg.role === 'user') {
        const content = msg.content.toLowerCase();

        // Extract relationship length
        const lengthMatch = content.match(
          /(\d+)\s*(year|month|week)s?\s*(together|relationship|dating)/i
        );
        if (lengthMatch) {
          intakeData.relationshipLength = `${lengthMatch[1]} ${lengthMatch[2]}s`;
        }

        // Look for concerns/goals keywords
        if (
          content.includes('concern') ||
          content.includes('problem') ||
          content.includes('issue')
        ) {
          intakeData.mainConcerns = msg.content;
        }

        if (
          content.includes('goal') ||
          content.includes('hope') ||
          content.includes('want to')
        ) {
          intakeData.goals = msg.content;
        }
      }
    });

    return Object.keys(intakeData).length > 0 ? intakeData : null;
  } catch (error) {
    console.error('Error getting intake data:', error);
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
