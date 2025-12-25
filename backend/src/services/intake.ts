import Anthropic from '@anthropic-ai/sdk';
import { conversationService } from './conversation';
import { ConversationSession, ConversationMessage, IntakeData } from '../types';
import { getDatabase } from './db';

/**
 * Intake Service
 *
 * Handles intake interview sessions for new users.
 * Manages conversation flow, data extraction, and storage.
 */

// Initialize Anthropic client for data extraction
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const EXTRACTION_MODEL = 'claude-sonnet-4-20250514';

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
   * Uses Claude to analyze the conversation and extract key insights
   */
  async extractIntakeData(messages: ConversationMessage[]): Promise<IntakeData> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
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
      const response = await anthropic.messages.create({
        model: EXTRACTION_MODEL,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
      });

      // Extract text content
      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

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

    // Update user record with intake data
    const result = await db.query(
      'UPDATE user SET intake_data = $intakeData WHERE firebaseUid = $userId',
      {
        userId,
        intakeData: {
          ...intakeData,
          completed_at: intakeData.completed_at.toISOString(),
          last_updated: intakeData.last_updated.toISOString(),
        }
      }
    );

    if (!result || result.length === 0) {
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

    const result = await db.query(
      'SELECT intake_data FROM user WHERE firebaseUid = $userId',
      { userId }
    );

    if (!result || result.length === 0 || !(result[0] as any).result || (result[0] as any).result.length === 0) {
      return null;
    }

    const user = (result[0] as any).result[0];

    if (!user.intake_data) {
      return null;
    }

    return user.intake_data;
  }
}

export const intakeService = new IntakeService();
