import { Server } from 'socket.io';
import { AuthenticatedSocket } from './index';
import { conversationService } from '../services/conversation';
import { conflictService } from '../services/conflict';
import { getRelationship } from '../services/relationship';
import { MessageRole } from '../types';
import {
  verifyMultiUserAccess,
  handleUserJoin,
  handleUserLeave,
  broadcastTyping,
  clearUserTyping,
} from './multi-user-room';

/**
 * Handle new WebSocket connection
 * Client joins a conversation room
 */
export function handleConnection(socket: AuthenticatedSocket, io: Server): void {
  socket.on('join', async (data: { sessionId: string }) => {
    try {
      const { sessionId } = data;

      if (!sessionId) {
        socket.emit('error', { message: 'sessionId is required' });
        return;
      }

      // Verify the session exists and user has access
      const session = await conversationService.getSession(sessionId);

      if (!session) {
        socket.emit('error', { message: 'Conversation session not found' });
        return;
      }

      // For relationship_shared sessions, verify multi-user access
      if (session.sessionType === 'relationship_shared') {
        const accessCheck = await verifyMultiUserAccess(
          sessionId,
          socket.userId!,
          conversationService.getSession.bind(conversationService),
          conflictService.getConflict.bind(conflictService),
          getRelationship
        );

        if (!accessCheck.allowed) {
          socket.emit('error', { message: accessCheck.reason || 'Access denied' });
          return;
        }

        // Join the room
        socket.sessionId = sessionId;
        socket.join(sessionId);

        // Handle multi-user room join (presence tracking)
        handleUserJoin(socket, io, sessionId, socket.userId!);

        // Send confirmation
        socket.emit('joined', {
          sessionId,
          session,
          isMultiUser: true,
        });

        console.log(`User ${socket.userId} joined multi-user session ${sessionId}`);
      } else {
        // For single-user sessions, verify ownership
        if (session.userId !== socket.userId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Join the room
        socket.sessionId = sessionId;
        socket.join(sessionId);

        // Send confirmation and current session state
        socket.emit('joined', {
          sessionId,
          session,
          isMultiUser: false,
        });

        console.log(`User ${socket.userId} joined session ${sessionId}`);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join conversation session' });
    }
  });
}

/**
 * Handle incoming message
 * Save to database and broadcast to room
 */
export async function handleMessage(
  socket: AuthenticatedSocket,
  io: Server,
  data: { content: string; role?: MessageRole; senderId?: string }
): Promise<void> {
  try {
    const { content, role = 'user', senderId } = data;

    if (!socket.sessionId) {
      socket.emit('error', { message: 'Not joined to any conversation' });
      return;
    }

    if (!content || content.trim().length === 0) {
      socket.emit('error', { message: 'Message content is required' });
      return;
    }

    // Save message to database
    const message = await conversationService.addMessage(
      socket.sessionId,
      role,
      content,
      senderId || socket.userId
    );

    // Clear typing indicator for this user
    if (socket.userId) {
      clearUserTyping(socket.sessionId, socket.userId);

      // Broadcast typing update to clear indicator
      socket.to(socket.sessionId).emit('typing_update', {
        userId: socket.userId,
        isTyping: false,
        typingUsers: [],
      });
    }

    // Broadcast message to all users in the room
    io.to(socket.sessionId).emit('message', message);

    console.log(
      `Message sent in session ${socket.sessionId} by user ${socket.userId}`
    );
  } catch (error) {
    console.error('Error handling message:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send message';
    socket.emit('error', { message: errorMessage });
  }
}

/**
 * Handle typing indicator
 * Broadcast typing status to other users in the room
 */
export function handleTyping(
  socket: AuthenticatedSocket,
  io: Server,
  data: { isTyping: boolean }
): void {
  try {
    if (!socket.sessionId || !socket.userId) {
      return;
    }

    const { isTyping } = data;

    // Use multi-user room typing broadcast
    broadcastTyping(socket, socket.sessionId, socket.userId, isTyping);
  } catch (error) {
    console.error('Error handling typing indicator:', error);
  }
}

/**
 * Handle disconnect
 * Cleanup and notify other users
 */
export function handleDisconnect(
  socket: AuthenticatedSocket,
  io: Server
): void {
  try {
    console.log(`Client disconnected: ${socket.id}, User: ${socket.userId}`);

    if (socket.sessionId && socket.userId) {
      // Handle multi-user room leave (presence tracking)
      handleUserLeave(io, socket.sessionId, socket.userId);

      // Leave the room
      socket.leave(socket.sessionId);
    }
  } catch (error) {
    console.error('Error handling disconnect:', error);
  }
}
