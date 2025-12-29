import { getDatabase } from './db';
import { User } from '../types';

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

export async function syncUser(
  firebaseUid: string,
  email: string,
  displayName: string
): Promise<User> {
  const db = getDatabase();
  const now = new Date().toISOString();

  try {
    // Check if user already exists
    const existingUsersRaw = await db.query<User[]>(
      'SELECT * FROM user WHERE firebaseUid = $firebaseUid',
      { firebaseUid }
    );

    const existingUsers = extractQueryResult<User>(existingUsersRaw);

    if (existingUsers.length > 0) {
      // Update existing user
      const userId = existingUsers[0].id;
      const updatedRaw = await db.query<User[]>(
        'UPDATE $userId SET email = $email, displayName = $displayName, updatedAt = $updatedAt',
        { userId, email, displayName, updatedAt: now }
      );

      const updated = extractQueryResult<User>(updatedRaw);
      if (updated.length > 0) {
        return updated[0];
      }

      return existingUsers[0];
    }

    // Create new user
    const createdRaw = await db.query<User[]>(
      'CREATE user CONTENT { firebaseUid: $firebaseUid, email: $email, displayName: $displayName, createdAt: $createdAt, updatedAt: $updatedAt }',
      { firebaseUid, email, displayName, createdAt: now, updatedAt: now }
    );

    const created = extractQueryResult<User>(createdRaw);
    if (created.length === 0) {
      throw new Error('Failed to create user');
    }

    return created[0];
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
}

export async function getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  const db = getDatabase();

  try {
    const resultRaw = await db.query<User[]>(
      'SELECT * FROM user WHERE firebaseUid = $firebaseUid',
      { firebaseUid }
    );

    const result = extractQueryResult<User>(resultRaw);
    if (result.length > 0) {
      return result[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting user by Firebase UID:', error);
    throw error;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  const db = getDatabase();

  try {
    const resultRaw = await db.query<User[]>(
      'SELECT * FROM $userId',
      { userId }
    );

    const result = extractQueryResult<User>(resultRaw);
    if (result.length > 0) {
      return result[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

export async function updateUser(
  userId: string,
  data: Partial<Pick<User, 'displayName' | 'email'>>
): Promise<User> {
  const db = getDatabase();
  const now = new Date().toISOString();

  try {
    const updatedRaw = await db.query<User[]>(
      'UPDATE $userId MERGE { displayName: $displayName, email: $email, updatedAt: $updatedAt }',
      { userId, ...data, updatedAt: now }
    );

    const updated = extractQueryResult<User>(updatedRaw);
    if (updated.length === 0) {
      throw new Error('Failed to update user');
    }

    return updated[0];
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function updateUserRelationship(
  userId: string,
  relationshipId: string | undefined
): Promise<User> {
  const db = getDatabase();
  const now = new Date().toISOString();

  try {
    const updatedRaw = await db.query<User[]>(
      'UPDATE $userId SET relationshipId = $relationshipId, updatedAt = $updatedAt',
      { userId, relationshipId, updatedAt: now }
    );

    const updated = extractQueryResult<User>(updatedRaw);
    if (updated.length === 0) {
      throw new Error('Failed to update user relationship');
    }

    return updated[0];
  } catch (error) {
    console.error('Error updating user relationship:', error);
    throw error;
  }
}

export async function updateUserPrimaryRelationship(
  userId: string,
  primaryRelationshipId: string | undefined
): Promise<User> {
  const db = getDatabase();
  const now = new Date().toISOString();

  try {
    const updatedRaw = await db.query<User[]>(
      'UPDATE $userId SET primaryRelationshipId = $primaryRelationshipId, updatedAt = $updatedAt',
      { userId, primaryRelationshipId, updatedAt: now }
    );

    const updated = extractQueryResult<User>(updatedRaw);
    if (updated.length === 0) {
      throw new Error('Failed to update user primary relationship');
    }

    return updated[0];
  } catch (error) {
    console.error('Error updating user primary relationship:', error);
    throw error;
  }
}
