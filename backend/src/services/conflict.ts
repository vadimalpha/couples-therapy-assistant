import { getDatabase } from './db';
import { conversationService } from './conversation';
import { generateConflictEmbedding } from './embeddings';
import { Conflict, ConflictStatus, ConflictPrivacy } from '../types';

export class ConflictService {
  /**
   * Create a new conflict and automatically create Partner A's individual session
   */
  async createConflict(
    userId: string,
    title: string,
    privacy: ConflictPrivacy,
    relationshipId: string
  ): Promise<Conflict> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const conflictData = {
      title,
      privacy,
      status: 'partner_a_chatting' as ConflictStatus,
      partner_a_id: userId,
      relationship_id: relationshipId,
      created_at: now,
      updated_at: now,
    };

    const result = await db.query('CREATE conflict CONTENT $data', {
      data: conflictData,
    });

    if (
      !result ||
      result.length === 0 ||
      !(result[0] as any).result ||
      (result[0] as any).result.length === 0
    ) {
      throw new Error('Failed to create conflict');
    }

    const conflict = (result[0] as any).result[0];

    // Automatically create Partner A's individual session
    const session = await conversationService.createSession(
      userId,
      'individual_a',
      conflict.id
    );

    // Update conflict with session ID
    const conflictId = conflict.id.startsWith('conflict:')
      ? conflict.id
      : `conflict:${conflict.id}`;

    await db.query(
      'UPDATE $conflictId SET partner_a_session_id = $sessionId, updated_at = $updated_at',
      {
        conflictId,
        sessionId: session.id,
        updated_at: new Date().toISOString(),
      }
    );

    // Generate and store embedding for conflict (async, don't block creation)
    generateConflictEmbedding(conflict.id, title).catch(error => {
      console.error('Failed to generate conflict embedding:', error);
    });

    return {
      ...conflict,
      partner_a_session_id: session.id,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Get a conflict by ID
   */
  async getConflict(conflictId: string): Promise<Conflict | null> {
    const db = getDatabase();

    const fullId = conflictId.startsWith('conflict:')
      ? conflictId
      : `conflict:${conflictId}`;

    const result = await db.query('SELECT * FROM $conflictId', {
      conflictId: fullId,
    });

    if (
      !result ||
      result.length === 0 ||
      !(result[0] as any).result ||
      (result[0] as any).result.length === 0
    ) {
      return null;
    }

    return (result[0] as any).result[0];
  }

  /**
   * Get conflict with visibility enforcement
   * Returns conflict data based on user's role and status
   */
  async getConflictWithVisibility(
    conflictId: string,
    userId: string
  ): Promise<{
    conflict: Conflict;
    canViewPartnerASession: boolean;
    canViewPartnerBSession: boolean;
  } | null> {
    const conflict = await this.getConflict(conflictId);

    if (!conflict) {
      return null;
    }

    // Verify user is part of this conflict
    if (
      conflict.partner_a_id !== userId &&
      conflict.partner_b_id !== userId
    ) {
      throw new Error('Access denied: User is not part of this conflict');
    }

    const isPartnerA = conflict.partner_a_id === userId;
    const isPartnerB = conflict.partner_b_id === userId;

    // Partner A can always see their own session
    // Partner B can always see their own session
    let canViewPartnerASession = isPartnerA;
    let canViewPartnerBSession = isPartnerB;

    // Visibility rules for Partner B viewing Partner A's session:
    // 1. Privacy must be 'shared'
    // 2. Partner B must have finalized their own session
    // 3. Status must be 'both_finalized'
    if (isPartnerB && conflict.privacy === 'shared') {
      // Check if Partner B has finalized their session
      if (conflict.partner_b_session_id) {
        const partnerBSession = await conversationService.getSession(
          conflict.partner_b_session_id
        );
        if (
          partnerBSession &&
          partnerBSession.status === 'finalized' &&
          conflict.status === 'both_finalized'
        ) {
          canViewPartnerASession = true;
        }
      }
    }

    // Visibility rules for Partner A viewing Partner B's session:
    // 1. Privacy must be 'shared'
    // 2. Partner A must have finalized their own session
    // 3. Status must be 'both_finalized'
    if (isPartnerA && conflict.privacy === 'shared') {
      // Check if Partner A has finalized their session
      if (conflict.partner_a_session_id) {
        const partnerASession = await conversationService.getSession(
          conflict.partner_a_session_id
        );
        if (
          partnerASession &&
          partnerASession.status === 'finalized' &&
          conflict.status === 'both_finalized'
        ) {
          canViewPartnerBSession = true;
        }
      }
    }

    return {
      conflict,
      canViewPartnerASession,
      canViewPartnerBSession,
    };
  }

  /**
   * Get all conflicts for a user
   */
  async getUserConflicts(userId: string): Promise<Conflict[]> {
    const db = getDatabase();

    const result = await db.query(
      'SELECT * FROM conflict WHERE partner_a_id = $userId OR partner_b_id = $userId ORDER BY created_at DESC',
      { userId }
    );

    if (!result || result.length === 0 || !(result[0] as any).result) {
      return [];
    }

    return (result[0] as any).result || [];
  }

  /**
   * Invite Partner B to join the conflict
   */
  async invitePartnerB(
    conflictId: string,
    partnerBId: string
  ): Promise<Conflict> {
    const db = getDatabase();

    const conflict = await this.getConflict(conflictId);

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    if (conflict.partner_b_id) {
      throw new Error('Partner B already invited');
    }

    if (conflict.status !== 'pending_partner_b') {
      throw new Error(
        'Conflict must be in pending_partner_b status to invite Partner B'
      );
    }

    // Create Partner B's individual session
    const session = await conversationService.createSession(
      partnerBId,
      'individual_b',
      conflictId
    );

    const fullId = conflictId.startsWith('conflict:')
      ? conflictId
      : `conflict:${conflictId}`;

    const updateResult = await db.query(
      'UPDATE $conflictId SET partner_b_id = $partnerBId, partner_b_session_id = $sessionId, status = $status, updated_at = $updated_at',
      {
        conflictId: fullId,
        partnerBId,
        sessionId: session.id,
        status: 'partner_b_chatting',
        updated_at: new Date().toISOString(),
      }
    );

    if (!updateResult || updateResult.length === 0 || !(updateResult[0] as any).result) {
      throw new Error('Failed to invite Partner B');
    }

    const updated = (updateResult[0] as any).result;
    return Array.isArray(updated) ? updated[0] : updated;
  }

  /**
   * Update conflict status
   * Validates status transitions
   */
  async updateStatus(
    conflictId: string,
    newStatus: ConflictStatus
  ): Promise<Conflict> {
    const db = getDatabase();

    const conflict = await this.getConflict(conflictId);

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    // Validate status transitions
    const validTransitions: Record<ConflictStatus, ConflictStatus[]> = {
      partner_a_chatting: ['pending_partner_b'],
      pending_partner_b: ['partner_b_chatting'],
      partner_b_chatting: ['both_finalized'],
      both_finalized: [],
    };

    if (!validTransitions[conflict.status].includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${conflict.status} to ${newStatus}`
      );
    }

    const fullId = conflictId.startsWith('conflict:')
      ? conflictId
      : `conflict:${conflictId}`;

    const updateResult = await db.query(
      'UPDATE $conflictId SET status = $status, updated_at = $updated_at',
      {
        conflictId: fullId,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }
    );

    if (!updateResult || updateResult.length === 0 || !(updateResult[0] as any).result) {
      throw new Error('Failed to update conflict status');
    }

    const updated = (updateResult[0] as any).result;
    return Array.isArray(updated) ? updated[0] : updated;
  }
}

export const conflictService = new ConflictService();
