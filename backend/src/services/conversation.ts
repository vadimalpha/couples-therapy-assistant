import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db';
import {
  ConversationSession,
  ConversationMessage,
  SessionType,
  MessageRole,
} from '../types';

export class ConversationService {
  /**
   * Create a new conversation session
   */
  async createSession(
    userId: string,
    sessionType: SessionType,
    conflictId?: string
  ): Promise<ConversationSession> {
    const db = getDatabase();
    const sessionId = `conversation:${uuidv4()}`;
    const now = new Date().toISOString();

    const session: ConversationSession = {
      id: sessionId,
      userId,
      sessionType,
      conflictId,
      status: 'active',
      messages: [],
      createdAt: now,
    };

    const result = await db.create(sessionId, session);

    if (!result || Array.isArray(result) && result.length === 0) {
      throw new Error('Failed to create conversation session');
    }

    return Array.isArray(result) ? result[0] : result;
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

    const result = await db.select<ConversationSession>(fullId);

    if (!result || Array.isArray(result) && result.length === 0) {
      return null;
    }

    return Array.isArray(result) ? result[0] : result;
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
      `UPDATE ${fullId} SET messages += $message`,
      { message }
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
      `UPDATE ${fullId} SET status = 'finalized', finalizedAt = $now`,
      { now: new Date().toISOString() }
    );

    if (!result || result.length === 0) {
      throw new Error('Failed to finalize conversation session');
    }

    const updated = result[0]?.result;
    return Array.isArray(updated) ? updated[0] : updated;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<ConversationSession[]> {
    const db = getDatabase();

    const result = await db.query<ConversationSession[]>(
      'SELECT * FROM conversation WHERE userId = $userId ORDER BY createdAt DESC',
      { userId }
    );

    if (!result || result.length === 0) {
      return [];
    }

    return result[0]?.result || [];
  }
}

export const conversationService = new ConversationService();
