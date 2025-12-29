import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db';
import {
  ConversationSession,
  ConversationMessage,
  SessionType,
  MessageRole,
} from '../types';
import { guidanceQueue } from '../queue';
import { IndividualGuidanceJob, JointContextGuidanceJob } from '../queue/jobs';
import { conflictService } from './conflict';
import { getRelationship } from './relationship';

/**
 * Helper to extract results from SurrealDB query response
 */
function extractQueryResult<T>(result: unknown): T[] {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return [];
  }
  const queryResult = result[0];
  if (Array.isArray(queryResult)) {
    return queryResult as T[];
  }
  if (queryResult && typeof queryResult === 'object' && 'result' in queryResult) {
    return (queryResult as { result: T[] }).result || [];
  }
  if (queryResult && typeof queryResult === 'object' && 'id' in queryResult) {
    return [queryResult as T];
  }
  return [];
}

export class ConversationService {
  /**
   * Create a new conversation session
   */
  async createSession(
    userId: string,
    sessionType: SessionType,
    conflictId?: string
  ): Promise<ConversationSession> {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      const sessionData = {
        userId,
        sessionType,
        conflictId,
        status: 'active',
        messages: [],
        createdAt: now,
      };

      console.log('Creating session with data:', JSON.stringify(sessionData));

      const result = await db.query(
        'CREATE conversation CONTENT $data',
        { data: sessionData }
      );

      console.log('Query result:', JSON.stringify(result, null, 2));

      const sessions = extractQueryResult<ConversationSession>(result);

      if (sessions.length === 0) {
        console.error('Failed to create session, result structure:', result);
        throw new Error('Failed to create conversation session');
      }

      const session = sessions[0];

      console.log('Session created successfully:', session.id);
      return session;
    } catch (error) {
      console.error('Error in createSession:', error);
      throw error;
    }
  }

  /**
   * Get a conversation session by ID
   */
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    const db = getDatabase();

    // Ensure sessionId has proper format
    const fullId = sessionId.startsWith('conversation:')
      ? sessionId
      : `conversation:${sessionId}`;

    // Use type::thing() to properly reference the record by ID
    const result = await db.query(
      'SELECT * FROM type::thing($sessionId)',
      { sessionId: fullId }
    );

    console.log('getSession query result:', JSON.stringify(result, null, 2));

    const sessions = extractQueryResult<ConversationSession>(result);
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Add a message to a conversation session
   */
  async addMessage(
    sessionId: string,
    role: MessageRole,
    content: string,
    senderId?: string
  ): Promise<ConversationMessage> {
    const db = getDatabase();

    // Get the session first to verify it exists and is active
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error('Conversation session not found');
    }

    if (session.status === 'finalized') {
      throw new Error('Cannot add messages to a finalized conversation');
    }

    const message: ConversationMessage = {
      id: uuidv4(),
      role,
      content,
      senderId,
      timestamp: new Date().toISOString(),
    };

    // Update the session with the new message
    const fullId = sessionId.startsWith('conversation:')
      ? sessionId
      : `conversation:${sessionId}`;

    await db.query(
      'UPDATE type::thing($sessionId) SET messages += $message',
      { sessionId: fullId, message }
    );

    return message;
  }

  /**
   * Get all messages from a conversation session
   */
  async getMessages(sessionId: string): Promise<ConversationMessage[]> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error('Conversation session not found');
    }

    return session.messages || [];
  }

  /**
   * Finalize a conversation session (lock it)
   */
  async finalizeSession(sessionId: string): Promise<ConversationSession> {
    const db = getDatabase();

    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error('Conversation session not found');
    }

    if (session.status === 'finalized') {
      return session;
    }

    const fullId = sessionId.startsWith('conversation:')
      ? sessionId
      : `conversation:${sessionId}`;

    const result = await db.query(
      'UPDATE type::thing($sessionId) SET status = $status, finalizedAt = $finalizedAt',
      { sessionId: fullId, status: 'finalized', finalizedAt: new Date().toISOString() }
    );

    const finalizedSessions = extractQueryResult<ConversationSession>(result);

    if (finalizedSessions.length === 0) {
      throw new Error('Failed to finalize conversation session');
    }

    const finalizedSession = finalizedSessions[0];

    // Queue guidance synthesis jobs for exploration sessions
    if (
      finalizedSession.sessionType === 'individual_a' ||
      finalizedSession.sessionType === 'individual_b'
    ) {
      const isPartnerA = finalizedSession.sessionType === 'individual_a';
      const partnerId = isPartnerA ? 'a' : 'b';

      // Queue individual guidance job
      if (finalizedSession.conflictId) {
        const individualJob: IndividualGuidanceJob = {
          type: 'individual_guidance',
          sessionId: finalizedSession.id,
          conflictId: finalizedSession.conflictId,
          partnerId,
        };

        await guidanceQueue.add('individual_guidance', individualJob);
        console.log(
          `Queued individual guidance job for session ${finalizedSession.id}`
        );

        // Check if both partners have finalized - if so, queue joint context jobs
        await this.checkAndQueueJointContextGuidance(finalizedSession.conflictId);
      }
    }

    return finalizedSession;
  }

  /**
   * Check if both partners have finalized and queue joint context guidance jobs
   */
  private async checkAndQueueJointContextGuidance(
    conflictId: string
  ): Promise<void> {
    const db = getDatabase();

    // Get conflict to check if both partners have finalized
    const fullConflictId = conflictId.startsWith('conflict:')
      ? conflictId
      : `conflict:${conflictId}`;

    const conflictResult = await db.query('SELECT * FROM type::thing($conflictId)', {
      conflictId: fullConflictId,
    });

    // Handle both old and new SurrealDB SDK result structures
    const queryResult = conflictResult[0];
    let conflict: any;

    if (Array.isArray(queryResult)) {
      conflict = queryResult[0];
    } else if (queryResult && typeof queryResult === 'object') {
      if ((queryResult as any).id) {
        conflict = queryResult;
      } else if ((queryResult as any).result) {
        const resultArray = (queryResult as any).result;
        conflict = Array.isArray(resultArray) ? resultArray[0] : resultArray;
      }
    }

    if (!conflict) {
      return;
    }

    // Check if both partners have sessions
    if (!conflict.partner_a_session_id || !conflict.partner_b_session_id) {
      return;
    }

    // Check if both sessions are finalized
    const partnerASession = await this.getSession(conflict.partner_a_session_id);
    const partnerBSession = await this.getSession(conflict.partner_b_session_id);

    if (
      !partnerASession ||
      !partnerBSession ||
      partnerASession.status !== 'finalized' ||
      partnerBSession.status !== 'finalized'
    ) {
      return;
    }

    // Both partners finalized - queue joint context jobs for both
    const jobA: JointContextGuidanceJob = {
      type: 'joint_context_guidance',
      conflictId: conflict.id,
      partnerId: conflict.partner_a_id,
    };

    const jobB: JointContextGuidanceJob = {
      type: 'joint_context_guidance',
      conflictId: conflict.id,
      partnerId: conflict.partner_b_id,
    };

    await guidanceQueue.add('joint_context_guidance', jobA);
    await guidanceQueue.add('joint_context_guidance', jobB);

    console.log(
      `Queued joint context guidance jobs for both partners in conflict ${conflict.id}`
    );
  }

  /**
   * Verify user has access to a conversation session
   * For relationship_shared sessions, verifies through conflict/relationship
   * For other sessions, verifies through ownership
   */
  async verifyUserAccessToSession(
    sessionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        return false;
      }

      // For relationship_shared sessions, verify through conflict
      if (session.sessionType === 'relationship_shared') {
        if (!session.conflictId) {
          return false;
        }

        const conflict = await conflictService.getConflict(session.conflictId);
        if (!conflict) {
          return false;
        }

        // Verify user is part of the conflict
        if (conflict.partner_a_id !== userId && conflict.partner_b_id !== userId) {
          return false;
        }

        // Verify conflict belongs to user's relationship
        const relationship = await getRelationship(userId);
        if (!relationship) {
          return false;
        }

        if (conflict.relationship_id !== relationship.id) {
          return false;
        }

        return true;
      }

      // For other session types, verify ownership
      return session.userId === userId;
    } catch (error) {
      console.error('Error verifying session access:', error);
      return false;
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<ConversationSession[]> {
    const db = getDatabase();

    const result = await db.query(
      'SELECT * FROM conversation WHERE userId = $userId ORDER BY createdAt DESC',
      { userId }
    );

    return extractQueryResult<ConversationSession>(result);
  }

  /**
   * Get all sessions for a specific conflict
   */
  async getSessionsByConflict(conflictId: string): Promise<ConversationSession[]> {
    const db = getDatabase();

    const result = await db.query(
      'SELECT * FROM conversation WHERE conflictId = $conflictId ORDER BY createdAt DESC',
      { conflictId }
    );

    return extractQueryResult<ConversationSession>(result);
  }
}

export const conversationService = new ConversationService();
