import { getDatabase } from './db';
import { conversationService } from './conversation';
import { generateConflictEmbedding } from './embeddings';
import { getRelationshipById } from './relationship';
import { getUserByFirebaseUid } from './user';
import { Conflict, ConflictStatus, ConflictPrivacy, GuidanceMode } from '../types';

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

export class ConflictService {
  /**
   * Create a new conflict and automatically create Partner A's individual session
   */
  async createConflict(
    userId: string,
    title: string,
    privacy: ConflictPrivacy,
    relationshipId: string,
    guidanceMode: GuidanceMode = 'conversational',
    description?: string
  ): Promise<Conflict> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const conflictData: Record<string, unknown> = {
      title,
      privacy,
      guidance_mode: guidanceMode,
      status: 'partner_a_chatting' as ConflictStatus,
      partner_a_id: userId,
      relationship_id: relationshipId,
      created_at: now,
      updated_at: now,
    };

    if (description) {
      conflictData.description = description;
    }

    const result = await db.query('CREATE conflict CONTENT $data', {
      data: conflictData,
    });

    const conflicts = extractQueryResult<Conflict>(result);
    if (conflicts.length === 0) {
      throw new Error('Failed to create conflict');
    }

    const conflict = conflicts[0];

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

    const conflicts = extractQueryResult<Conflict>(result);
    if (conflicts.length === 0) {
      return null;
    }

    // Ensure backward compatibility - default to 'conversational' for existing conflicts
    const conflict = conflicts[0];
    if (!conflict.guidance_mode) {
      conflict.guidance_mode = 'conversational';
    }

    return conflict;
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

    // Check if user is directly part of this conflict
    const isPartnerA = conflict.partner_a_id === userId;
    const isPartnerB = conflict.partner_b_id === userId;

    // If user is not directly part, check if they're part of the relationship
    // This allows Partner B to access the conflict before joining (to call /join)
    if (!isPartnerA && !isPartnerB) {
      // Check if user is part of the conflict's relationship
      if (conflict.relationship_id) {
        const relationship = await getRelationshipById(conflict.relationship_id);

        // Get SurrealDB user ID from Firebase UID (userId param is Firebase UID)
        const currentUser = await getUserByFirebaseUid(userId);
        const surrealUserId = currentUser?.id;

        const isInRelationship = relationship && surrealUserId && (
          relationship.user1Id === surrealUserId ||
          relationship.user2Id === surrealUserId
        );

        if (!isInRelationship) {
          throw new Error('Access denied: User is not part of this conflict');
        }
        // User is Partner B through relationship but hasn't joined yet
      } else {
        throw new Error('Access denied: User is not part of this conflict');
      }
    }

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
   * Includes conflicts where user is Partner A, Partner B, or part of the relationship
   */
  async getUserConflicts(userId: string): Promise<Conflict[]> {
    const db = getDatabase();

    // Get conflicts where user is directly Partner A or Partner B (userId is Firebase UID)
    const directResult = await db.query(
      'SELECT * FROM conflict WHERE partner_a_id = $userId OR partner_b_id = $userId ORDER BY created_at DESC',
      { userId }
    );
    const directConflicts = extractQueryResult<Conflict>(directResult);

    // Get SurrealDB user ID from Firebase UID for relationship queries
    const currentUser = await getUserByFirebaseUid(userId);
    if (!currentUser) {
      return directConflicts;
    }
    const surrealUserId = currentUser.id;

    // Get relationships the user is part of (using SurrealDB user ID)
    const relationshipResult = await db.query(
      'SELECT id FROM relationship WHERE user1Id = $surrealUserId OR user2Id = $surrealUserId',
      { surrealUserId }
    );
    const relationships = extractQueryResult<{ id: string }>(relationshipResult);

    if (relationships.length === 0) {
      return directConflicts;
    }

    // Get conflicts from those relationships where user isn't Partner A (they're the potential Partner B)
    // Query each relationship individually to avoid SurrealDB IN clause issues
    const relationshipConflicts: Conflict[] = [];
    for (const rel of relationships) {
      const relConflictResult = await db.query(
        'SELECT * FROM conflict WHERE relationship_id = $relationshipId AND partner_a_id != $userId ORDER BY created_at DESC',
        { relationshipId: rel.id, userId }
      );
      const conflicts = extractQueryResult<Conflict>(relConflictResult);
      relationshipConflicts.push(...conflicts);
    }

    // Merge and deduplicate
    const allConflicts = [...directConflicts];
    for (const conflict of relationshipConflicts) {
      if (!allConflicts.find(c => c.id === conflict.id)) {
        allConflicts.push(conflict);
      }
    }

    // Sort by created_at
    allConflicts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allConflicts;
  }

  /**
   * Get all conflicts for a specific relationship
   */
  async getConflictsByRelationship(relationshipId: string): Promise<Conflict[]> {
    const db = getDatabase();

    const result = await db.query(
      'SELECT * FROM conflict WHERE relationship_id = $relationshipId ORDER BY created_at DESC',
      { relationshipId }
    );

    return extractQueryResult<Conflict>(result);
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

    // Allow Partner B to join when Partner A is still chatting OR when waiting for Partner B
    if (!['partner_a_chatting', 'pending_partner_b'].includes(conflict.status)) {
      throw new Error(
        'Conflict must be in partner_a_chatting or pending_partner_b status to invite Partner B'
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

    const updated = extractQueryResult<Conflict>(updateResult);
    if (updated.length === 0) {
      throw new Error('Failed to invite Partner B');
    }

    return updated[0];
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
      partner_a_chatting: ['pending_partner_b', 'partner_b_chatting'],  // B can join while A chatting
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

    const updated = extractQueryResult<Conflict>(updateResult);
    if (updated.length === 0) {
      throw new Error('Failed to update conflict status');
    }

    return updated[0];
  }
}

export const conflictService = new ConflictService();
