import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db';
import { Relationship, Invitation } from '../types';
import { getUserById, updateUserRelationship } from './user';

const INVITATION_EXPIRY_HOURS = 72;

export async function createInvitation(
  userId: string,
  partnerEmail: string
): Promise<Invitation> {
  const db = getDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);
  const token = uuidv4();

  try {
    // Get inviter details
    const inviter = await getUserById(userId);
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Check if user already has an active relationship
    if (inviter.relationshipId) {
      throw new Error('User already has an active relationship');
    }

    // Check if invitation already exists for this email from this user
    const existingInvitations = await db.query<Invitation[]>(
      'SELECT * FROM invitation WHERE inviterId = $inviterId AND partnerEmail = $partnerEmail AND status = "pending"',
      { inviterId: userId, partnerEmail }
    );

    if (existingInvitations && existingInvitations.length > 0 && existingInvitations[0].result && existingInvitations[0].result.length > 0) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Create invitation
    const created = await db.query<Invitation[]>(
      'CREATE invitation CONTENT { token: $token, inviterId: $inviterId, inviterEmail: $inviterEmail, partnerEmail: $partnerEmail, status: "pending", expiresAt: $expiresAt, createdAt: $createdAt }',
      {
        token,
        inviterId: userId,
        inviterEmail: inviter.email,
        partnerEmail,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
      }
    );

    if (!created || created.length === 0 || !created[0].result || created[0].result.length === 0) {
      throw new Error('Failed to create invitation');
    }

    return created[0].result[0];
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const db = getDatabase();

  try {
    const result = await db.query<Invitation[]>(
      'SELECT * FROM invitation WHERE token = $token',
      { token }
    );

    if (result && result.length > 0 && result[0].result && result[0].result.length > 0) {
      return result[0].result[0];
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

    // Verify email matches
    if (acceptingUser.email !== invitation.partnerEmail) {
      throw new Error('Invitation is for a different email address');
    }

    // Check if accepting user already has a relationship
    if (acceptingUser.relationshipId) {
      throw new Error('User already has an active relationship');
    }

    // Get inviter
    const inviter = await getUserById(invitation.inviterId);
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Check if inviter already has a relationship (could have changed since invitation)
    if (inviter.relationshipId) {
      throw new Error('Inviter already has an active relationship');
    }

    // Create relationship
    const created = await db.query<Relationship[]>(
      'CREATE relationship CONTENT { user1Id: $user1Id, user2Id: $user2Id, status: "active", createdAt: $createdAt, updatedAt: $updatedAt }',
      {
        user1Id: invitation.inviterId,
        user2Id: userId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
    );

    if (!created || created.length === 0 || !created[0].result || created[0].result.length === 0) {
      throw new Error('Failed to create relationship');
    }

    const relationship = created[0].result[0];

    // Update both users with relationship ID
    await updateUserRelationship(invitation.inviterId, relationship.id);
    await updateUserRelationship(userId, relationship.id);

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

    const result = await db.query<Relationship[]>(
      'SELECT * FROM $relationshipId',
      { relationshipId: user.relationshipId }
    );

    if (result && result.length > 0 && result[0].result && result[0].result.length > 0) {
      return result[0].result[0];
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
    const result = await db.query<Relationship[]>(
      'SELECT * FROM $relationshipId',
      { relationshipId }
    );

    if (!result || result.length === 0 || !result[0].result || result[0].result.length === 0) {
      throw new Error('Relationship not found');
    }

    const relationship = result[0].result[0];

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

    const result = await db.query<Invitation[]>(
      'SELECT * FROM invitation WHERE partnerEmail = $email AND status = "pending" ORDER BY createdAt DESC',
      { email: user.email }
    );

    if (result && result.length > 0 && result[0].result) {
      return result[0].result;
    }

    return [];
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    throw error;
  }
}
