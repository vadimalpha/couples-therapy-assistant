import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from './index';

/**
 * Presence tracking for multi-user rooms
 * Tracks which users are currently connected to each conversation room
 */
interface RoomPresence {
  [sessionId: string]: Set<string>; // sessionId -> Set of userIds
}

/**
 * Typing indicator tracking for multi-user rooms
 * Tracks which users are currently typing in each conversation room
 */
interface RoomTyping {
  [sessionId: string]: Set<string>; // sessionId -> Set of userIds currently typing
}

// In-memory tracking (consider Redis for production scaling)
const roomPresence: RoomPresence = {};
const roomTyping: RoomTyping = {};

/**
 * Add a user to a room's presence tracking
 */
export function addUserToRoom(sessionId: string, userId: string): void {
  if (!roomPresence[sessionId]) {
    roomPresence[sessionId] = new Set();
  }
  roomPresence[sessionId].add(userId);
}

/**
 * Remove a user from a room's presence tracking
 */
export function removeUserFromRoom(sessionId: string, userId: string): void {
  if (roomPresence[sessionId]) {
    roomPresence[sessionId].delete(userId);

    // Clean up empty room
    if (roomPresence[sessionId].size === 0) {
      delete roomPresence[sessionId];
    }
  }
}

/**
 * Get all users currently in a room
 */
export function getRoomUsers(sessionId: string): string[] {
  return Array.from(roomPresence[sessionId] || []);
}

/**
 * Get presence status for a room
 */
export function getRoomPresence(sessionId: string): { userId: string; online: boolean }[] {
  const onlineUsers = getRoomUsers(sessionId);
  return onlineUsers.map(userId => ({ userId, online: true }));
}

/**
 * Broadcast presence update to all users in a room
 */
export function broadcastPresence(
  io: Server,
  sessionId: string,
  userId: string,
  status: 'joined' | 'left'
): void {
  const presence = getRoomPresence(sessionId);

  io.to(sessionId).emit('presence_update', {
    userId,
    status,
    presence,
  });
}

/**
 * Set user typing status in a room
 */
export function setUserTyping(sessionId: string, userId: string, isTyping: boolean): void {
  if (!roomTyping[sessionId]) {
    roomTyping[sessionId] = new Set();
  }

  if (isTyping) {
    roomTyping[sessionId].add(userId);
  } else {
    roomTyping[sessionId].delete(userId);

    // Clean up empty typing set
    if (roomTyping[sessionId].size === 0) {
      delete roomTyping[sessionId];
    }
  }
}

/**
 * Get list of users currently typing in a room
 */
export function getTypingUsers(sessionId: string): string[] {
  return Array.from(roomTyping[sessionId] || []);
}

/**
 * Clear typing indicator for a user (called when they send a message)
 */
export function clearUserTyping(sessionId: string, userId: string): void {
  setUserTyping(sessionId, userId, false);
}

/**
 * Broadcast typing indicator update to other users in the room
 */
export function broadcastTyping(
  socket: AuthenticatedSocket,
  sessionId: string,
  userId: string,
  isTyping: boolean
): void {
  // Update tracking
  setUserTyping(sessionId, userId, isTyping);

  // Get current typing users
  const typingUsers = getTypingUsers(sessionId);

  // Broadcast to all users in the room except sender
  socket.to(sessionId).emit('typing_update', {
    userId,
    isTyping,
    typingUsers,
  });
}

/**
 * Verify user has access to a relationship_shared session
 * Checks that:
 * 1. Session is of type 'relationship_shared'
 * 2. User is part of the conflict's relationship
 */
export async function verifyMultiUserAccess(
  sessionId: string,
  userId: string,
  getSession: (id: string) => Promise<any>,
  getConflict: (id: string) => Promise<any>,
  getRelationship: (userId: string) => Promise<any>
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Get the session
    const session = await getSession(sessionId);
    if (!session) {
      return { allowed: false, reason: 'Session not found' };
    }

    // Only relationship_shared sessions support multi-user
    if (session.sessionType !== 'relationship_shared') {
      return { allowed: false, reason: 'Session is not a multi-user session' };
    }

    // Get the conflict
    if (!session.conflictId) {
      return { allowed: false, reason: 'Session has no associated conflict' };
    }

    const conflict = await getConflict(session.conflictId);
    if (!conflict) {
      return { allowed: false, reason: 'Conflict not found' };
    }

    // Verify user is part of the conflict
    if (conflict.partner_a_id !== userId && conflict.partner_b_id !== userId) {
      return { allowed: false, reason: 'User is not part of this conflict' };
    }

    // Get user's relationship
    const relationship = await getRelationship(userId);
    if (!relationship) {
      return { allowed: false, reason: 'User has no active relationship' };
    }

    // Verify conflict belongs to user's relationship
    if (conflict.relationship_id !== relationship.id) {
      return { allowed: false, reason: 'Conflict does not belong to user\'s relationship' };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error verifying multi-user access:', error);
    return { allowed: false, reason: 'Access verification failed' };
  }
}

/**
 * Handle user joining a multi-user room
 * Updates presence and broadcasts to other users
 */
export function handleUserJoin(
  socket: AuthenticatedSocket,
  io: Server,
  sessionId: string,
  userId: string
): void {
  // Add to presence tracking
  addUserToRoom(sessionId, userId);

  // Broadcast presence update
  broadcastPresence(io, sessionId, userId, 'joined');

  // Send current room state to the joining user
  socket.emit('room_state', {
    sessionId,
    presence: getRoomPresence(sessionId),
    typingUsers: getTypingUsers(sessionId),
  });
}

/**
 * Handle user leaving a multi-user room
 * Updates presence and broadcasts to other users
 */
export function handleUserLeave(
  io: Server,
  sessionId: string,
  userId: string
): void {
  // Remove from presence tracking
  removeUserFromRoom(sessionId, userId);

  // Clear typing indicator if set
  clearUserTyping(sessionId, userId);

  // Broadcast presence update
  broadcastPresence(io, sessionId, userId, 'left');
}

/**
 * Clean up all room data for testing/debugging
 */
export function clearAllRoomData(): void {
  Object.keys(roomPresence).forEach(key => delete roomPresence[key]);
  Object.keys(roomTyping).forEach(key => delete roomTyping[key]);
}
