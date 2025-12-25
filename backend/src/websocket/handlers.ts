import { Server } from 'socket.io';
import { AuthenticatedSocket } from './index';
import { conversationService } from '../services/conversation';
import { MessageRole } from '../types';

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
      });

      console.log(`User ${socket.userId} joined session ${sessionId}`);
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
    if (!socket.sessionId) {
      return;
    }

    const { isTyping } = data;

    // Broadcast to all users in the room except sender
    socket.to(socket.sessionId).emit('typing', {
      userId: socket.userId,
      isTyping,
    });
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

    if (socket.sessionId) {
      // Notify other users in the room
      socket.to(socket.sessionId).emit('user_left', {
        userId: socket.userId,
      });

      // Leave the room
      socket.leave(socket.sessionId);
    }
  } catch (error) {
    console.error('Error handling disconnect:', error);
  }
}
