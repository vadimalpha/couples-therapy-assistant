import { getDatabase } from './db';
import { User } from '../types';

export async function syncUser(
  firebaseUid: string,
  email: string,
  displayName: string
): Promise<User> {
  const db = getDatabase();
  const now = new Date().toISOString();

  try {
    // Check if user already exists
    const existingUsers = await db.query<User[]>(
      'SELECT * FROM user WHERE firebaseUid = $firebaseUid',
      { firebaseUid }
    );

    if (existingUsers && existingUsers.length > 0 && existingUsers[0].result && existingUsers[0].result.length > 0) {
      // Update existing user
      const userId = existingUsers[0].result[0].id;
      const updated = await db.query<User[]>(
        'UPDATE $userId SET email = $email, displayName = $displayName, updatedAt = $updatedAt',
        { userId, email, displayName, updatedAt: now }
      );

      if (updated && updated.length > 0 && updated[0].result) {
        return updated[0].result[0];
      }

      return existingUsers[0].result[0];
    }

    // Create new user
    const created = await db.query<User[]>(
      'CREATE user CONTENT { firebaseUid: $firebaseUid, email: $email, displayName: $displayName, createdAt: $createdAt, updatedAt: $updatedAt }',
      { firebaseUid, email, displayName, createdAt: now, updatedAt: now }
    );

    if (!created || created.length === 0 || !created[0].result || created[0].result.length === 0) {
      throw new Error('Failed to create user');
    }

    return created[0].result[0];
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
}

export async function getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  const db = getDatabase();

  try {
    const result = await db.query<User[]>(
      'SELECT * FROM user WHERE firebaseUid = $firebaseUid',
      { firebaseUid }
    );

    if (result && result.length > 0 && result[0].result && result[0].result.length > 0) {
      return result[0].result[0];
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
    const result = await db.query<User[]>(
      'SELECT * FROM $userId',
      { userId }
    );

    if (result && result.length > 0 && result[0].result && result[0].result.length > 0) {
      return result[0].result[0];
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
    const updated = await db.query<User[]>(
      'UPDATE $userId MERGE { displayName: $displayName, email: $email, updatedAt: $updatedAt }',
      { userId, ...data, updatedAt: now }
    );

    if (!updated || updated.length === 0 || !updated[0].result || updated[0].result.length === 0) {
      throw new Error('Failed to update user');
    }

    return updated[0].result[0];
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
    const updated = await db.query<User[]>(
      'UPDATE $userId SET relationshipId = $relationshipId, updatedAt = $updatedAt',
      { userId, relationshipId, updatedAt: now }
    );

    if (!updated || updated.length === 0 || !updated[0].result || updated[0].result.length === 0) {
      throw new Error('Failed to update user relationship');
    }

    return updated[0].result[0];
  } catch (error) {
    console.error('Error updating user relationship:', error);
    throw error;
  }
}
