import OpenAI from 'openai';
import { conversationService } from './conversation';
import { ConversationSession, ConversationMessage, IntakeData } from '../types';
import { getDatabase } from './db';

/**
 * Intake Service
 *
 * Handles intake interview sessions for new users.
 * Manages conversation flow, data extraction, and storage.
 */

/**
 * Helper to extract results from SurrealDB query response
 * Supports both old format (result[0].result) and v1.x format (result[0] is array)
 */
function extractQueryResult<T>(result: unknown): T[] {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return [];
  }

  // Check for old format: result[0].result
  if (result[0] && typeof result[0] === 'object' && 'result' in result[0]) {
    return (result[0] as { result: T[] }).result || [];
  }

  // v1.x format: result[0] is directly an array or the item itself
  if (Array.isArray(result[0])) {
    return result[0] as T[];
  }

  // Single item returned directly
  if (result[0] && typeof result[0] === 'object') {
    return [result[0] as T];
  }

  return [];
}

// Lazy-initialized OpenAI client for data extraction
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }
  return openai;
}

const EXTRACTION_MODEL = 'gpt-5-2';

// Intake sections for progress tracking
const INTAKE_SECTIONS = [
  { id: 'basics', label: 'Relationship Basics', questionCount: 5 },
  { id: 'communication', label: 'Communication Style', questionCount: 6 },
  { id: 'friction', label: 'Common Topics', questionCount: 3 },
  { id: 'history', label: 'Relationship History', questionCount: 4 },
  { id: 'background', label: 'Background', questionCount: 3 },
  { id: 'goals', label: 'Goals', questionCount: 3 },
];

export class IntakeService {
  /**
   * Get or create an intake session for a user
   * If user has an active intake session, return it
   * Otherwise create a new one
   */
  async getOrCreateIntakeSession(userId: string): Promise<ConversationSession> {
    // Check for existing active intake session
    const existingSession = await this.getIntakeSession(userId);

    if (existingSession && existingSession.status === 'active') {
      return existingSession;
    }

    // Create new intake session
    return await conversationService.createSession(userId, 'intake');
  }

  /**
   * Calculate progress based on message count
   * Returns current section and completed sections
   */
  calculateProgress(messageCount: number): {
    currentSection: string;
    completedSections: string[];
    percentage: number;
  } {
    // Approximate: each user message + AI response = 2 messages per question
    // We estimate progress based on message pairs
    const questionsPassed = Math.floor(messageCount / 2);

    let currentSectionIndex = 0;
    let questionsInPreviousSections = 0;

    for (let i = 0; i < INTAKE_SECTIONS.length; i++) {
      const section = INTAKE_SECTIONS[i];
      if (questionsPassed < questionsInPreviousSections + section.questionCount) {
        currentSectionIndex = i;
        break;
      }
      questionsInPreviousSections += section.questionCount;
      currentSectionIndex = i + 1;
    }

    // Cap at last section
    currentSectionIndex = Math.min(currentSectionIndex, INTAKE_SECTIONS.length - 1);

    const completedSections = INTAKE_SECTIONS
      .slice(0, currentSectionIndex)
      .map((s) => s.id);

    const totalQuestions = INTAKE_SECTIONS.reduce((sum, s) => sum + s.questionCount, 0);
    const percentage = Math.min(100, Math.round((questionsPassed / totalQuestions) * 100));

    return {
      currentSection: INTAKE_SECTIONS[currentSectionIndex].id,
      completedSections,
      percentage,
    };
  }

  /**
   * Get user's intake session (active or finalized)
   */
  async getIntakeSession(userId: string): Promise<ConversationSession | null> {
    const sessions = await conversationService.getUserSessions(userId);

    // Find most recent intake session
    const intakeSessions = sessions.filter(s => s.sessionType === 'intake');

    if (intakeSessions.length === 0) {
      return null;
    }

    // Return most recent (sessions are ordered by createdAt DESC)
    return intakeSessions[0];
  }

  /**
   * Finalize intake session and extract structured data
   */
  async finalizeIntake(sessionId: string): Promise<IntakeData> {
    // Get the session
    const session = await conversationService.getSession(sessionId);

    if (!session) {
      throw new Error('Intake session not found');
    }

    if (session.sessionType !== 'intake') {
      throw new Error('Session is not an intake session');
    }

    // Finalize the conversation session
    await conversationService.finalizeSession(sessionId);

    // Extract structured data from conversation
    const intakeData = await this.extractIntakeData(session.messages);

    // Save to user profile
    await this.saveIntakeData(session.userId, intakeData);

    return intakeData;
  }

  /**
   * Extract structured intake data from conversation messages
   * Uses OpenAI to analyze the conversation and extract key insights
   */
  async extractIntakeData(messages: ConversationMessage[]): Promise<IntakeData> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build conversation transcript
    const transcript = messages
      .map(msg => {
        const speaker = msg.role === 'ai' ? 'Therapist' : 'User';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n\n');

    const extractionPrompt = `You are analyzing an intake interview conversation between a therapist and a user. Extract the following information from the conversation and return it as a JSON object.

Required fields:
- name: User's name (string)
- relationship_duration: How long they've been in their relationship (string, e.g., "3 years", "6 months")
- living_situation: Their current living arrangement (string, e.g., "living together", "long distance", "separate homes")
- communication_style_summary: Summary of how they communicate during conflict (string, 2-3 sentences)
- conflict_triggers: Array of things that tend to trigger conflicts (array of strings)
- previous_patterns: Summary of patterns from previous relationships if mentioned (string, or "Not discussed" if not mentioned)
- relationship_goals: What they hope to work on or achieve (array of strings)

Return ONLY valid JSON with these exact field names. If information is not clear from the conversation, use your best judgment based on context, or use "Not specified" for strings and empty arrays for arrays.

Conversation transcript:
${transcript}`;

    try {
      const response = await getOpenAI().chat.completions.create({
        model: EXTRACTION_MODEL,
        max_completion_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        response_format: { type: 'json_object' },
      });

      // Extract text content
      const content = response.choices[0]?.message?.content || '{}';

      // Parse JSON response
      const extracted = JSON.parse(content);

      // Build IntakeData object
      const intakeData: Partial<IntakeData> = {
        name: extracted.name || 'Not specified',
        relationship_duration: extracted.relationship_duration || 'Not specified',
        living_situation: extracted.living_situation || 'Not specified',
        communication_style_summary: extracted.communication_style_summary || 'Not specified',
        conflict_triggers: Array.isArray(extracted.conflict_triggers)
          ? extracted.conflict_triggers
          : [],
        previous_patterns: extracted.previous_patterns || 'Not discussed',
        relationship_goals: Array.isArray(extracted.relationship_goals)
          ? extracted.relationship_goals
          : [],
        completed_at: new Date(),
        last_updated: new Date(),
      };

      return intakeData as IntakeData;
    } catch (error) {
      console.error('Error extracting intake data:', error);
      throw new Error(
        `Failed to extract intake data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save intake data to user profile
   */
  async saveIntakeData(userId: string, intakeData: IntakeData): Promise<void> {
    const db = getDatabase();

    // First, find the user by firebaseUid to get their record ID
    const userResult = await db.query(
      'SELECT * FROM user WHERE firebaseUid = $firebaseUid',
      { firebaseUid: userId }
    );

    const users = extractQueryResult<{ id: string }>(userResult);
    if (users.length === 0) {
      throw new Error('User not found');
    }

    const userRecordId = users[0].id;

    // Update user record with intake data using the record ID
    // Use camelCase 'intakeData' to match the rest of the codebase (rag.ts, users.ts)
    const result = await db.query(
      'UPDATE $userRecordId SET intakeData = $intakeData',
      {
        userRecordId,
        intakeData: {
          ...intakeData,
          completed_at: intakeData.completed_at.toISOString(),
          last_updated: intakeData.last_updated.toISOString(),
        }
      }
    );

    const updated = extractQueryResult<{ id: string }>(result);
    if (updated.length === 0) {
      throw new Error('Failed to save intake data to user profile');
    }
  }

  /**
   * Trigger quarterly intake refresh
   * Creates a new intake session for the user to update their information
   */
  async refreshIntake(userId: string): Promise<ConversationSession> {
    // Check if user has existing intake data
    const existingSession = await this.getIntakeSession(userId);

    if (!existingSession || existingSession.status !== 'finalized') {
      throw new Error('User must complete initial intake before refreshing');
    }

    // Create new intake session for refresh
    return await conversationService.createSession(userId, 'intake');
  }

  /**
   * Get intake data from user profile
   */
  async getIntakeData(userId: string): Promise<IntakeData | null> {
    const db = getDatabase();

    // Use camelCase 'intakeData' to match the rest of the codebase
    const result = await db.query(
      'SELECT intakeData FROM user WHERE firebaseUid = $userId',
      { userId }
    );

    const users = extractQueryResult<{ intakeData?: IntakeData }>(result);
    if (users.length === 0) {
      return null;
    }

    return users[0].intakeData || null;
  }
}

export const intakeService = new IntakeService();
