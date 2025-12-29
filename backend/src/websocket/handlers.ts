import { Server } from 'socket.io';
import { AuthenticatedSocket } from './index';
import { conversationService } from '../services/conversation';
import { conflictService } from '../services/conflict';
import { getRelationship } from '../services/relationship';
import { intakeService } from '../services/intake';
import { MessageRole } from '../types';
import {
  verifyMultiUserAccess,
  handleUserJoin,
  handleUserLeave,
  broadcastTyping,
  clearUserTyping,
} from './multi-user-room';
import {
  streamExplorationResponse,
  streamRelationshipResponse,
  ExplorationContext,
  RelationshipContext
} from '../services/chat-ai';
import { getUserById } from '../services/user';
import { SessionType } from '../types';

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

    // Trigger AI response for user messages (not for AI messages)
    if (role === 'user') {
      await triggerAIResponse(socket, io, socket.sessionId, socket.userId!);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send message';
    socket.emit('error', { message: errorMessage });
  }
}

/**
 * Trigger AI response based on session type
 */
async function triggerAIResponse(
  socket: AuthenticatedSocket,
  io: Server,
  sessionId: string,
  userId: string
): Promise<void> {
  try {
    // Get the session to determine type
    const session = await conversationService.getSession(sessionId);
    if (!session) {
      console.error('Session not found for AI response:', sessionId);
      return;
    }

    const sessionType = session.sessionType as SessionType;

    // Only generate AI responses for exploration and relationship sessions
    if (!['individual_a', 'individual_b', 'relationship_shared'].includes(sessionType)) {
      return;
    }

    // For exploration sessions, emit directly to the socket to avoid duplicates
    // from multiple socket connections (React Strict Mode can cause this)
    // For relationship_shared, emit to room so both partners can see
    const emitToClient = sessionType === 'relationship_shared'
      ? (event: string, data?: any) => io.to(sessionId).emit(event, data)
      : (event: string, data?: any) => socket.emit(event, data);

    // Emit stream-start to notify clients
    emitToClient('stream-start');

    let fullContent = '';

    if (sessionType === 'individual_a' || sessionType === 'individual_b') {
      // Exploration chat - use streamExplorationResponse
      const context: ExplorationContext = {
        userId,
        conflictId: session.conflictId,
        sessionType,
      };

      const result = await streamExplorationResponse(
        session.messages,
        context,
        (chunk: string) => {
          emitToClient('stream-chunk', { content: chunk });
        }
      );
      fullContent = result.fullContent;

      console.log(
        `AI exploration response - Session: ${sessionId}, Tokens: ${result.usage.inputTokens}/${result.usage.outputTokens}, Cost: $${result.usage.totalCost.toFixed(4)}`
      );
    } else if (sessionType === 'relationship_shared') {
      // Relationship shared chat - need conflict info for partner IDs
      if (!session.conflictId) {
        console.error('Relationship session missing conflictId:', sessionId);
        emitToClient('stream-end');
        return;
      }

      const conflict = await conflictService.getConflict(session.conflictId);
      if (!conflict) {
        console.error('Conflict not found for relationship session:', session.conflictId);
        emitToClient('stream-end');
        return;
      }

      const relationshipContext: RelationshipContext = {
        sessionId,
        conflictId: session.conflictId,
        partnerAId: conflict.partner_a_id,
        partnerBId: conflict.partner_b_id || '',
        senderId: userId,
      };

      const result = await streamRelationshipResponse(
        session.messages,
        relationshipContext,
        (chunk: string) => {
          emitToClient('stream-chunk', { content: chunk });
        }
      );
      fullContent = result.fullContent;

      console.log(
        `AI relationship response - Session: ${sessionId}, Tokens: ${result.usage.inputTokens}/${result.usage.outputTokens}, Cost: $${result.usage.totalCost.toFixed(4)}`
      );
    }

    // Save the AI message to the database (do this before stream-end so it's persisted)
    if (fullContent) {
      await conversationService.addMessage(
        sessionId,
        'ai',
        fullContent
      );
      // Note: We don't emit 'message' event here because the frontend
      // already has the content from streaming. The streamed message
      // becomes the final message when stream-end is received.
    }

    // Emit stream-end to notify clients (this finalizes the streamed message)
    emitToClient('stream-end');
  } catch (error) {
    console.error('Error triggering AI response:', error);
    // Emit stream-end to clean up client state
    socket.emit('stream-end');
    socket.emit('error', {
      message: `AI response failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
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

/**
 * Handle finalize session
 * For intake: extracts intake data and saves to user profile
 * For exploration (individual_a/individual_b): marks session finalized and updates conflict status
 */
export async function handleFinalize(
  socket: AuthenticatedSocket,
  io: Server,
  data: { sessionId: string },
  callback?: (response: { error?: string; success?: boolean }) => void
): Promise<void> {
  try {
    const { sessionId } = data;

    if (!sessionId) {
      callback?.({ error: 'sessionId is required' });
      return;
    }

    // Verify session exists and user has access
    const session = await conversationService.getSession(sessionId);

    if (!session) {
      callback?.({ error: 'Session not found' });
      return;
    }

    if (session.userId !== socket.userId) {
      callback?.({ error: 'Access denied' });
      return;
    }

    // Handle different session types
    if (session.sessionType === 'intake') {
      console.log(`Finalizing intake session ${sessionId} for user ${socket.userId}`);

      // Finalize the intake session
      const intakeData = await intakeService.finalizeIntake(sessionId);

      console.log(`Intake finalized for user ${socket.userId}:`, intakeData);

      // Notify client of successful finalization
      socket.emit('finalized', { intakeData });

      // Send success callback
      callback?.({ success: true });
    } else if (session.sessionType === 'individual_a' || session.sessionType === 'individual_b') {
      console.log(`Finalizing exploration session ${sessionId} for user ${socket.userId}`);

      if (!session.conflictId) {
        callback?.({ error: 'Session has no associated conflict' });
        return;
      }

      // Finalize the conversation session (marks as finalized, queues guidance jobs)
      await conversationService.finalizeSession(sessionId);

      // Update conflict status based on which partner finalized
      const conflict = await conflictService.getConflict(session.conflictId);
      if (!conflict) {
        callback?.({ error: 'Associated conflict not found' });
        return;
      }

      // Determine next status based on current status and which partner finalized
      if (session.sessionType === 'individual_a' && conflict.status === 'partner_a_chatting') {
        // Partner A finished exploring - wait for Partner B
        await conflictService.updateStatus(session.conflictId, 'pending_partner_b');
        console.log(`Conflict ${session.conflictId} status updated to pending_partner_b`);
      } else if (session.sessionType === 'individual_b' && conflict.status === 'partner_b_chatting') {
        // Partner B finished exploring - both are now finalized
        await conflictService.updateStatus(session.conflictId, 'both_finalized');
        console.log(`Conflict ${session.conflictId} status updated to both_finalized`);
      }

      console.log(`Exploration session finalized for user ${socket.userId}`);

      // Notify client of successful finalization
      socket.emit('finalized', { conflictId: session.conflictId });

      // Send success callback
      callback?.({ success: true });
    } else {
      callback?.({ error: `Cannot finalize session of type: ${session.sessionType}` });
    }
  } catch (error) {
    console.error('Error finalizing session:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to finalize session';
    callback?.({ error: errorMessage });
  }
}
