import OpenAI from 'openai';
import { ConversationMessage, SessionType } from '../types';
import { buildPrompt } from './prompt-builder';
import { conversationService } from './conversation';
import { conflictService } from './conflict';
import { getUserById } from './user';
import { logPrompt } from './prompt-logger';

/**
 * Chat AI Service
 *
 * Handles AI-powered conversations using OpenAI GPT-5.2.
 * Provides exploration chat, guidance synthesis, and relationship orchestration.
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Model configuration
const MODEL = 'gpt-4o';
const EXPLORATION_MAX_COMPLETION_TOKENS = 1024;
const GUIDANCE_MAX_COMPLETION_TOKENS = 2048;
const JOINT_CONTEXT_MAX_COMPLETION_TOKENS = 3072;
const RELATIONSHIP_MAX_COMPLETION_TOKENS = 1536;
const SYNTHESIS_MAX_COMPLETION_TOKENS = 2048;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number; // in USD
}

export interface ExplorationContext {
  userId: string;
  conflictId?: string;
  sessionType: string;
  intakeData?: any;
  relationshipContext?: any;
  guidanceMode?: 'structured' | 'conversational' | 'test';
}

export interface RelationshipContext {
  sessionId: string;
  conflictId: string;
  partnerAId: string;
  partnerBId: string;
  senderId?: string;
}

export interface GuidanceSynthesisResult {
  guidance: string;
  usage: TokenUsage;
  sessionId: string;
}

/**
 * Generate AI response for exploration phase
 */
export async function generateExplorationResponse(
  messages: ConversationMessage[],
  context: ExplorationContext
): Promise<{ content: string; usage: TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Get user and conflict info first (needed for guidanceMode and logging)
    const user = await getUserById(context.userId);
    const conflict = context.conflictId
      ? await conflictService.getConflict(context.conflictId)
      : null;

    // Set guidanceMode from conflict if not already set in context
    const enrichedContext = {
      ...context,
      guidanceMode: context.guidanceMode || conflict?.guidance_mode || 'conversational',
    };

    const systemPrompt = await buildSystemPrompt('exploration-system-prompt.txt', enrichedContext);
    const openaiMessages = convertMessagesToOpenAI(messages);

    const userMessageContent = messages.length > 0
      ? messages[messages.length - 1].content
      : '';

    const response = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: EXPLORATION_MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const usage = calculateUsageFromResponse(response);

    // Log the prompt
    logPrompt({
      userId: context.userId,
      userEmail: user?.email,
      userName: user?.displayName,
      conflictId: context.conflictId,
      conflictTitle: conflict?.title,
      sessionType: context.sessionType as SessionType,
      logType: 'exploration',
      guidanceMode: enrichedContext.guidanceMode,
      systemPrompt,
      userMessage: userMessageContent,
      aiResponse: content,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.totalCost,
    });

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
    // Get user and conflict info first (needed for guidanceMode and logging)
    const user = await getUserById(context.userId);
    const conflict = context.conflictId
      ? await conflictService.getConflict(context.conflictId)
      : null;

    // Set guidanceMode from conflict if not already set in context
    const enrichedContext = {
      ...context,
      guidanceMode: context.guidanceMode || conflict?.guidance_mode || 'conversational',
    };

    const systemPrompt = await buildSystemPrompt('exploration-system-prompt.txt', enrichedContext);
    const openaiMessages = convertMessagesToOpenAI(messages);

    const userMessageContent = messages.length > 0
      ? messages[messages.length - 1].content
      : '';

    const stream = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: EXPLORATION_MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages,
      ],
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullContent = '';
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalCost: 0 };

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

    // Log the prompt
    logPrompt({
      userId: context.userId,
      userEmail: user?.email,
      userName: user?.displayName,
      conflictId: context.conflictId,
      conflictTitle: conflict?.title,
      sessionType: context.sessionType as SessionType,
      logType: 'exploration',
      guidanceMode: enrichedContext.guidanceMode,
      systemPrompt,
      userMessage: userMessageContent,
      aiResponse: fullContent,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.totalCost,
    });

    return { fullContent, usage };
  } catch (error) {
    console.error('Error streaming AI response:', error);
    throw new Error(
      `Failed to stream AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Synthesize individual guidance from a single partner's exploration session
 */
export async function synthesizeIndividualGuidance(
  explorationSessionId: string
): Promise<GuidanceSynthesisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const explorationSession = await conversationService.getSession(explorationSessionId);
    if (!explorationSession) {
      throw new Error('Exploration session not found');
    }

    if (explorationSession.status !== 'finalized') {
      throw new Error('Exploration session must be finalized before synthesizing guidance');
    }

    const isPartnerA = explorationSession.sessionType === 'individual_a';
    const jointContextSessionType = isPartnerA ? 'joint_context_a' : 'joint_context_b';

    const user = await getUserById(explorationSession.userId);
    const intakeData = await getIntakeData(explorationSession.userId);

    // Get conflict to determine guidance mode
    const conflict = explorationSession.conflictId
      ? await conflictService.getConflict(explorationSession.conflictId)
      : null;

    const systemPrompt = await buildPrompt('individual-guidance-prompt.txt', {
      conflictId: explorationSession.conflictId || '',
      userId: explorationSession.userId,
      sessionType: explorationSession.sessionType,
      includeRAG: !!explorationSession.conflictId,
      includePatterns: false,
      guidanceMode: conflict?.guidance_mode || 'conversational',
    });

    const context = buildIndividualContext(
      explorationSession.messages,
      intakeData,
      user?.displayName
    );

    const response = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: GUIDANCE_MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context },
      ],
    });

    const guidance = response.choices[0]?.message?.content || '';
    const usage = calculateUsageFromResponse(response);

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

    const jointContextSession = await conversationService.createSession(
      explorationSession.userId,
      jointContextSessionType,
      explorationSession.conflictId
    );

    await conversationService.addMessage(jointContextSession.id, 'ai', guidance);

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
 */
export async function synthesizeJointContextGuidance(
  conflictId: string,
  partnerId: string
): Promise<GuidanceSynthesisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const conflict = await conflictService.getConflict(conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    if (!conflict.partner_a_session_id || !conflict.partner_b_session_id) {
      throw new Error('Both partners must have exploration sessions');
    }

    const partnerASession = await conversationService.getSession(conflict.partner_a_session_id);
    const partnerBSession = await conversationService.getSession(conflict.partner_b_session_id);

    if (!partnerASession || !partnerBSession) {
      throw new Error('Could not retrieve partner exploration sessions');
    }

    if (
      partnerASession.status !== 'finalized' ||
      partnerBSession.status !== 'finalized'
    ) {
      throw new Error('Both partners must finalize their exploration sessions first');
    }

    const isPartnerA = partnerId === conflict.partner_a_id;
    const requestingPartner = isPartnerA ? partnerASession : partnerBSession;
    const otherPartner = isPartnerA ? partnerBSession : partnerASession;

    const requestingUser = await getUserById(partnerId);
    const otherUserId = isPartnerA ? conflict.partner_b_id : conflict.partner_a_id;
    const otherUser = otherUserId ? await getUserById(otherUserId) : null;

    const requestingIntakeData = await getIntakeData(partnerId);
    const otherIntakeData = otherUserId ? await getIntakeData(otherUserId) : null;

    const systemPrompt = await buildPrompt('joint-context-synthesis.txt', {
      conflictId,
      userId: partnerId,
      sessionType: isPartnerA ? 'joint_context_a' : 'joint_context_b',
      includeRAG: true,
      includePatterns: true,
      guidanceMode: conflict.guidance_mode || 'conversational',
    });

    const context = buildJointContext(
      requestingPartner.messages,
      otherPartner.messages,
      requestingIntakeData,
      otherIntakeData,
      requestingUser?.displayName,
      otherUser?.displayName
    );

    const response = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: JOINT_CONTEXT_MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context },
      ],
    });

    const guidance = response.choices[0]?.message?.content || '';
    const usage = calculateUsageFromResponse(response);

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

    const jointContextSessionType = isPartnerA ? 'joint_context_a' : 'joint_context_b';
    const existingSessions = await conversationService.getUserSessions(partnerId);
    let jointContextSession = existingSessions.find(
      (s) => s.sessionType === jointContextSessionType && s.conflictId === conflictId
    );

    if (!jointContextSession) {
      jointContextSession = await conversationService.createSession(
        partnerId,
        jointContextSessionType,
        conflictId
      );
    }

    await conversationService.addMessage(jointContextSession.id, 'ai', guidance);

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
 * Generate initial synthesis message for relationship_shared session
 */
export async function generateRelationshipSynthesis(
  context: RelationshipContext
): Promise<{ content: string; usage: TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const conflict = await conflictService.getConflict(context.conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    if (!conflict.partner_a_session_id || !conflict.partner_b_session_id) {
      throw new Error('Both partners must complete exploration before starting shared session');
    }

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

    const partnerAUser = await getUserById(context.partnerAId);
    const partnerBUser = await getUserById(context.partnerBId);

    const partnerAGuidance = await getPartnerGuidance(context.partnerAId, context.conflictId);
    const partnerBGuidance = await getPartnerGuidance(context.partnerBId, context.conflictId);

    const systemPrompt = await buildPrompt('relationship-synthesis.txt', {
      conflictId: context.conflictId,
      userId: context.partnerAId,
      sessionType: 'relationship_shared',
      includeRAG: true,
      includePatterns: true,
      guidanceMode: conflict.guidance_mode || 'conversational',
    });

    const synthesisContext = buildRelationshipSynthesisContext(
      partnerAExploration.messages,
      partnerBExploration.messages,
      partnerAGuidance,
      partnerBGuidance,
      partnerAUser?.displayName,
      partnerBUser?.displayName,
      conflict.title
    );

    const response = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: SYNTHESIS_MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: synthesisContext },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const usage = calculateUsageFromResponse(response);

    console.log(
      `Relationship synthesis - Conflict: ${context.conflictId}, Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}, Cost: $${usage.totalCost.toFixed(4)}`
    );

    // Log the prompt
    logPrompt({
      userId: context.partnerAId,
      userEmail: partnerAUser?.email,
      userName: partnerAUser?.displayName,
      conflictId: context.conflictId,
      conflictTitle: conflict.title,
      sessionId: context.sessionId,
      sessionType: 'relationship_shared',
      logType: 'relationship_synthesis',
      guidanceMode: conflict.guidance_mode,
      systemPrompt,
      userMessage: synthesisContext,
      aiResponse: content,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.totalCost,
    });

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
 */
export async function generateRelationshipResponse(
  messages: ConversationMessage[],
  context: RelationshipContext
): Promise<{ content: string; usage: TokenUsage }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const partnerAUser = await getUserById(context.partnerAId);
    const partnerBUser = await getUserById(context.partnerBId);
    const conflict = await conflictService.getConflict(context.conflictId);

    const systemPrompt = await buildPrompt('relationship-chat.txt', {
      conflictId: context.conflictId,
      userId: context.partnerAId,
      sessionType: 'relationship_shared',
      includeRAG: true,
      includePatterns: true,
    });

    const enrichedSystemPrompt = buildSystemPromptWithSenderContext(
      systemPrompt,
      partnerAUser?.displayName,
      partnerBUser?.displayName
    );

    const openaiMessages = convertRelationshipMessages(
      messages,
      context.partnerAId,
      context.partnerBId,
      partnerAUser?.displayName,
      partnerBUser?.displayName
    );

    const userMessageContent = messages.length > 0
      ? messages[messages.length - 1].content
      : '';

    const response = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: RELATIONSHIP_MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: enrichedSystemPrompt },
        ...openaiMessages,
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const usage = calculateUsageFromResponse(response);

    console.log(
      `Relationship chat - Session: ${context.sessionId}, Sender: ${context.senderId || 'unknown'}, Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}, Cost: $${usage.totalCost.toFixed(4)}`
    );

    // Log the prompt
    const senderId = context.senderId || context.partnerAId;
    const senderUser = senderId === context.partnerAId ? partnerAUser : partnerBUser;
    logPrompt({
      userId: senderId,
      userEmail: senderUser?.email,
      userName: senderUser?.displayName,
      conflictId: context.conflictId,
      conflictTitle: conflict?.title,
      sessionId: context.sessionId,
      sessionType: 'relationship_shared',
      logType: 'relationship_chat',
      guidanceMode: conflict?.guidance_mode,
      systemPrompt: enrichedSystemPrompt,
      userMessage: userMessageContent,
      aiResponse: content,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.totalCost,
    });

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
    const partnerAUser = await getUserById(context.partnerAId);
    const partnerBUser = await getUserById(context.partnerBId);
    const conflict = await conflictService.getConflict(context.conflictId);

    const systemPrompt = await buildPrompt('relationship-chat.txt', {
      conflictId: context.conflictId,
      userId: context.partnerAId,
      sessionType: 'relationship_shared',
      includeRAG: true,
      includePatterns: true,
    });

    const enrichedSystemPrompt = buildSystemPromptWithSenderContext(
      systemPrompt,
      partnerAUser?.displayName,
      partnerBUser?.displayName
    );

    const openaiMessages = convertRelationshipMessages(
      messages,
      context.partnerAId,
      context.partnerBId,
      partnerAUser?.displayName,
      partnerBUser?.displayName
    );

    const userMessageContent = messages.length > 0
      ? messages[messages.length - 1].content
      : '';

    const stream = await openai.chat.completions.create({
      model: MODEL,
      max_completion_tokens: RELATIONSHIP_MAX_COMPLETION_TOKENS,
      messages: [
        { role: 'system', content: enrichedSystemPrompt },
        ...openaiMessages,
      ],
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullContent = '';
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalCost: 0 };

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        onChunk(delta);
      }

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

    console.log(
      `Relationship chat (stream) - Session: ${context.sessionId}, Sender: ${context.senderId || 'unknown'}, Input tokens: ${usage.inputTokens}, Output tokens: ${usage.outputTokens}, Cost: $${usage.totalCost.toFixed(4)}`
    );

    // Log the prompt
    const senderId = context.senderId || context.partnerAId;
    const senderUser = senderId === context.partnerAId ? partnerAUser : partnerBUser;
    logPrompt({
      userId: senderId,
      userEmail: senderUser?.email,
      userName: senderUser?.displayName,
      conflictId: context.conflictId,
      conflictTitle: conflict?.title,
      sessionId: context.sessionId,
      sessionType: 'relationship_shared',
      logType: 'relationship_chat',
      guidanceMode: conflict?.guidance_mode,
      systemPrompt: enrichedSystemPrompt,
      userMessage: userMessageContent,
      aiResponse: fullContent,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.totalCost,
    });

    return { fullContent, usage };
  } catch (error) {
    console.error('Error streaming relationship response:', error);
    throw new Error(
      `Failed to stream relationship response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Helper functions

async function buildSystemPrompt(
  promptFile: string,
  context: ExplorationContext
): Promise<string> {
  let systemPrompt: string;
  if (context.conflictId) {
    systemPrompt = await buildPrompt(promptFile, {
      conflictId: context.conflictId,
      userId: context.userId,
      sessionType: context.sessionType as any,
      includeRAG: true,
      includePatterns: false,
      guidanceMode: context.guidanceMode,
    });
  } else {
    systemPrompt = await buildPrompt(promptFile, {
      conflictId: '',
      userId: context.userId,
      sessionType: context.sessionType as any,
      includeRAG: false,
      includePatterns: false,
      guidanceMode: context.guidanceMode,
    });
  }

  return buildSystemPromptWithContext(systemPrompt, context);
}

function buildSystemPromptWithContext(
  basePrompt: string,
  context: ExplorationContext
): string {
  let prompt = basePrompt;

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

  if (context.relationshipContext) {
    prompt += '\n\nRelationship Context:';
    prompt += `\n${JSON.stringify(context.relationshipContext, null, 2)}`;
  }

  return prompt;
}

function convertMessagesToOpenAI(
  messages: ConversationMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((msg) => msg.role === 'user' || msg.role === 'ai')
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}

function buildIndividualContext(
  messages: ConversationMessage[],
  intakeData: any,
  userName?: string
): string {
  let context = 'Below is the exploration conversation with this individual:\n\n';

  context += '--- EXPLORATION CONVERSATION ---\n\n';
  messages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

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

  if (userName) {
    context += `User's name: ${userName}\n\n`;
  }

  context += `Please synthesize personalized guidance based on this exploration conversation. Draw directly from what was shared, validate their experience, identify key themes, and offer warm, actionable suggestions. End with an invitation for continued dialogue.`;

  return context;
}

function buildJointContext(
  requestingPartnerMessages: ConversationMessage[],
  otherPartnerMessages: ConversationMessage[],
  requestingIntakeData: any,
  otherIntakeData: any,
  requestingPartnerName?: string,
  otherPartnerName?: string
): string {
  let context = '';

  context += `This guidance is being prepared for: ${requestingPartnerName || 'Partner A'}\n\n`;

  context += `--- ${requestingPartnerName || 'PARTNER A'}'S EXPLORATION CONVERSATION ---\n\n`;
  requestingPartnerMessages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

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

  context += `--- ${otherPartnerName || 'PARTNER B'}'S EXPLORATION CONVERSATION ---\n\n`;
  otherPartnerMessages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

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

  context += `--- ${partnerAName || 'PARTNER A'}'S EXPLORATION CONVERSATION ---\n\n`;
  partnerAMessages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

  if (partnerAGuidance) {
    context += `--- GUIDANCE PROVIDED TO ${partnerAName || 'PARTNER A'} ---\n\n`;
    context += `${partnerAGuidance}\n\n`;
  }

  context += `--- ${partnerBName || 'PARTNER B'}'S EXPLORATION CONVERSATION ---\n\n`;
  partnerBMessages.forEach((msg) => {
    const label = msg.role === 'user' ? 'User' : 'Therapist';
    context += `${label}: ${msg.content}\n\n`;
  });

  if (partnerBGuidance) {
    context += `--- GUIDANCE PROVIDED TO ${partnerBName || 'PARTNER B'} ---\n\n`;
    context += `${partnerBGuidance}\n\n`;
  }

  context += `Please create a warm, welcoming initial message that brings both partners together. Acknowledge what you heard from each of them, highlight areas of alignment and divergence, and invite them into constructive dialogue. Remember to address them as a couple and set a hopeful, collaborative tone.`;

  return context;
}

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
      const isPartnerA = msg.senderId === partnerAId;
      const senderName = isPartnerA
        ? partnerAName || 'Partner A'
        : partnerBName || 'Partner B';

      return {
        role: 'user' as const,
        content: `[Message from ${senderName}]\n${msg.content}`,
      };
    }
  });
}

async function getPartnerGuidance(
  partnerId: string,
  conflictId: string
): Promise<string | null> {
  try {
    const sessions = await conversationService.getUserSessions(partnerId);

    const jointContextSession = sessions.find(
      (s) =>
        (s.sessionType === 'joint_context_a' || s.sessionType === 'joint_context_b') &&
        s.conflictId === conflictId &&
        s.messages.length > 0
    );

    if (!jointContextSession) {
      return null;
    }

    const guidanceMessage = jointContextSession.messages.find((msg) => msg.role === 'ai');

    return guidanceMessage?.content || null;
  } catch (error) {
    console.error('Error getting partner guidance:', error);
    return null;
  }
}

async function getIntakeData(userId: string): Promise<any | null> {
  try {
    const sessions = await conversationService.getUserSessions(userId);
    const intakeSession = sessions.find((s) => s.sessionType === 'intake');

    if (!intakeSession || !intakeSession.messages.length) {
      return null;
    }

    const intakeData: any = {};

    intakeSession.messages.forEach((msg) => {
      if (msg.role === 'user') {
        const content = msg.content.toLowerCase();

        const lengthMatch = content.match(
          /(\d+)\s*(year|month|week)s?\s*(together|relationship|dating)/i
        );
        if (lengthMatch) {
          intakeData.relationshipLength = `${lengthMatch[1]} ${lengthMatch[2]}s`;
        }

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

function calculateUsageFromResponse(response: any): TokenUsage {
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  return {
    inputTokens,
    outputTokens,
    totalCost: calculateCost(inputTokens, outputTokens),
  };
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
