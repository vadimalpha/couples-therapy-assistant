import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db';
import { Relationship, Invitation, RelationshipType } from '../types';
import { getUserById, updateUserRelationship, updateUserPrimaryRelationship } from './user';

const INVITATION_EXPIRY_HOURS = 72;

/**
 * Normalize email by removing +alias part (vadim+test@example.com -> vadim@example.com)
 */
function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@');
  const normalizedLocal = local.split('+')[0];
  return `${normalizedLocal}@${domain}`;
}

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

export async function createInvitation(
  userId: string,
  partnerEmail: string,
  relationshipType: RelationshipType = 'partner'
): Promise<Invitation> {
  const db = getDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);
  const inviteToken = uuidv4();

  try {
    // Get inviter details
    const inviter = await getUserById(userId);
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Check if invitation already exists for this email from this user
    const existingInvitationsRaw = await db.query<Invitation[]>(
      'SELECT * FROM invitation WHERE inviterId = $inviterId AND partnerEmail = $partnerEmail AND status = "pending"',
      { inviterId: userId, partnerEmail }
    );

    const existingInvitations = extractQueryResult<Invitation>(existingInvitationsRaw);
    if (existingInvitations.length > 0) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Create invitation
    const createdRaw = await db.query<Invitation[]>(
      'CREATE invitation CONTENT { inviteToken: $inviteToken, inviterId: $inviterId, inviterEmail: $inviterEmail, partnerEmail: $partnerEmail, relationshipType: $relationshipType, status: "pending", expiresAt: $expiresAt, createdAt: $createdAt }',
      {
        inviteToken,
        inviterId: userId,
        inviterEmail: inviter.email,
        partnerEmail,
        relationshipType,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
      }
    );

    const created = extractQueryResult<Invitation>(createdRaw);
    if (created.length === 0) {
      throw new Error('Failed to create invitation');
    }

    return created[0];
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }
}

export async function getInvitationByToken(inviteToken: string): Promise<Invitation | null> {
  const db = getDatabase();

  try {
    const resultRaw = await db.query<Invitation[]>(
      'SELECT * FROM invitation WHERE inviteToken = $inviteToken',
      { inviteToken }
    );

    const result = extractQueryResult<Invitation>(resultRaw);
    if (result.length > 0) {
      return result[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting invitation by token:', error);
    throw error;
  }
}

export async function acceptInvitation(token: string, userId: string): Promise<Relationship> {
  const db = getDatabase();
  const now = new Date();

  try {
    // Get invitation
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Validate invitation
    if (invitation.status !== 'pending') {
      throw new Error('Invitation has already been used');
    }

    if (new Date(invitation.expiresAt) < now) {
      // Mark as expired
      await db.query(
        'UPDATE $invitationId SET status = "expired"',
        { invitationId: invitation.id }
      );
      throw new Error('Invitation has expired');
    }

    // Get accepting user
    const acceptingUser = await getUserById(userId);
    if (!acceptingUser) {
      throw new Error('User not found');
    }

    // Verify email matches (normalize to handle +alias variants)
    if (normalizeEmail(acceptingUser.email) !== normalizeEmail(invitation.partnerEmail)) {
      throw new Error('Invitation is for a different email address');
    }

    // Get inviter
    const inviter = await getUserById(invitation.inviterId);
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Check if a relationship already exists between these users
    const existingRelationship = await getRelationshipBetweenUsers(invitation.inviterId, userId);
    if (existingRelationship && existingRelationship.status === 'active') {
      throw new Error('A relationship already exists between these users');
    }

    // Get relationship type from invitation (default to 'partner' for legacy invitations)
    const relationshipType = invitation.relationshipType || 'partner';

    // Create relationship
    const createdRaw = await db.query<Relationship[]>(
      'CREATE relationship CONTENT { user1Id: $user1Id, user2Id: $user2Id, type: $type, status: "active", createdAt: $createdAt, updatedAt: $updatedAt }',
      {
        user1Id: invitation.inviterId,
        user2Id: userId,
        type: relationshipType,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
    );

    const created = extractQueryResult<Relationship>(createdRaw);
    if (created.length === 0) {
      throw new Error('Failed to create relationship');
    }

    const relationship = created[0];

    // For partner type, set as primary if user doesn't have one
    if (relationshipType === 'partner') {
      if (!inviter.primaryRelationshipId) {
        await updateUserPrimaryRelationship(invitation.inviterId, relationship.id);
      }
      if (!acceptingUser.primaryRelationshipId) {
        await updateUserPrimaryRelationship(userId, relationship.id);
      }
    }

    // Legacy support: update relationshipId for first relationship
    if (!inviter.relationshipId) {
      await updateUserRelationship(invitation.inviterId, relationship.id);
    }
    if (!acceptingUser.relationshipId) {
      await updateUserRelationship(userId, relationship.id);
    }

    // Mark invitation as accepted
    await db.query(
      'UPDATE $invitationId SET status = "accepted"',
      { invitationId: invitation.id }
    );

    return relationship;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

export async function getRelationship(userId: string): Promise<Relationship | null> {
  const db = getDatabase();

  try {
    // Get user to find their relationship ID
    const user = await getUserById(userId);
    if (!user || !user.relationshipId) {
      return null;
    }

    const resultRaw = await db.query<Relationship[]>(
      'SELECT * FROM $relationshipId',
      { relationshipId: user.relationshipId }
    );

    const result = extractQueryResult<Relationship>(resultRaw);
    if (result.length > 0) {
      return result[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting relationship:', error);
    throw error;
  }
}

export async function unpair(relationshipId: string, userId: string): Promise<void> {
  const db = getDatabase();
  const now = new Date();

  try {
    // Get relationship
    const resultRaw = await db.query<Relationship[]>(
      'SELECT * FROM $relationshipId',
      { relationshipId }
    );

    const result = extractQueryResult<Relationship>(resultRaw);
    if (result.length === 0) {
      throw new Error('Relationship not found');
    }

    const relationship = result[0];

    // Verify user is part of this relationship
    if (relationship.user1Id !== userId && relationship.user2Id !== userId) {
      throw new Error('User is not part of this relationship');
    }

    // Update relationship status
    await db.query(
      'UPDATE $relationshipId SET status = "inactive", updatedAt = $updatedAt',
      { relationshipId, updatedAt: now.toISOString() }
    );

    // Remove relationship ID from both users
    await updateUserRelationship(relationship.user1Id, undefined);
    await updateUserRelationship(relationship.user2Id, undefined);
  } catch (error) {
    console.error('Error unpairing relationship:', error);
    throw error;
  }
}

export async function getPendingInvitations(userId: string): Promise<Invitation[]> {
  const db = getDatabase();

  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const resultRaw = await db.query<Invitation[]>(
      'SELECT * FROM invitation WHERE partnerEmail = $email AND status = "pending" ORDER BY createdAt DESC',
      { email: user.email }
    );

    return extractQueryResult<Invitation>(resultRaw);
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    throw error;
  }
}

/**
 * Get sent invitations (where user is the inviter)
 */
export async function getSentInvitations(userId: string): Promise<Invitation[]> {
  const db = getDatabase();

  try {
    const resultRaw = await db.query<Invitation[]>(
      'SELECT * FROM invitation WHERE inviterId = $userId AND status = "pending" ORDER BY createdAt DESC',
      { userId }
    );

    return extractQueryResult<Invitation>(resultRaw);
  } catch (error) {
    console.error('Error getting sent invitations:', error);
    throw error;
  }
}

/**
 * Get all relationships for a user (active ones)
 */
export async function getAllRelationships(userId: string): Promise<Relationship[]> {
  const db = getDatabase();

  try {
    const resultRaw = await db.query<Relationship[]>(
      'SELECT * FROM relationship WHERE (user1Id = $userId OR user2Id = $userId) AND status = "active" ORDER BY createdAt DESC',
      { userId }
    );

    return extractQueryResult<Relationship>(resultRaw);
  } catch (error) {
    console.error('Error getting all relationships:', error);
    throw error;
  }
}

/**
 * Get a specific relationship between two users
 */
export async function getRelationshipBetweenUsers(
  user1Id: string,
  user2Id: string
): Promise<Relationship | null> {
  const db = getDatabase();

  try {
    const resultRaw = await db.query<Relationship[]>(
      'SELECT * FROM relationship WHERE ((user1Id = $user1Id AND user2Id = $user2Id) OR (user1Id = $user2Id AND user2Id = $user1Id))',
      { user1Id, user2Id }
    );

    const result = extractQueryResult<Relationship>(resultRaw);
    if (result.length > 0) {
      return result[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting relationship between users:', error);
    throw error;
  }
}

/**
 * Set a relationship as the primary relationship for a user
 */
export async function setPrimaryRelationship(
  userId: string,
  relationshipId: string
): Promise<void> {
  const db = getDatabase();

  try {
    // Verify the relationship exists and user is part of it
    const resultRaw = await db.query<Relationship[]>(
      'SELECT * FROM $relationshipId',
      { relationshipId }
    );

    const result = extractQueryResult<Relationship>(resultRaw);
    if (result.length === 0) {
      throw new Error('Relationship not found');
    }

    const relationship = result[0];

    if (relationship.user1Id !== userId && relationship.user2Id !== userId) {
      throw new Error('User is not part of this relationship');
    }

    if (relationship.status !== 'active') {
      throw new Error('Cannot set inactive relationship as primary');
    }

    // Update user's primary relationship
    await updateUserPrimaryRelationship(userId, relationshipId);

    // Also update legacy relationshipId for compatibility
    await updateUserRelationship(userId, relationshipId);
  } catch (error) {
    console.error('Error setting primary relationship:', error);
    throw error;
  }
}

/**
 * Get relationship by ID
 */
export async function getRelationshipById(relationshipId: string): Promise<Relationship | null> {
  const db = getDatabase();

  try {
    const resultRaw = await db.query<Relationship[]>(
      'SELECT * FROM $relationshipId',
      { relationshipId }
    );

    const result = extractQueryResult<Relationship>(resultRaw);
    if (result.length > 0) {
      return result[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting relationship by ID:', error);
    throw error;
  }
}
