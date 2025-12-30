import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import * as admin from 'firebase-admin';
import {
  handleConnection,
  handleMessage,
  handleTyping,
  handleDisconnect,
  handleFinalize,
} from './handlers';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  sessionId?: string;
}

/**
 * Initialize WebSocket server with Socket.IO
 */
export function initializeWebSocket(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      // Debug logging for token
      console.log('WebSocket auth - token type:', typeof token);
      console.log('WebSocket auth - token length:', token ? token.length : 'null');
      if (token) {
        console.log('WebSocket auth - token preview:', token.substring(0, 50) + '...' + token.substring(token.length - 20));
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify Firebase token
      const decoded = await admin.auth().verifyIdToken(token);
      socket.userId = decoded.uid;
      console.log('WebSocket auth - verified user:', decoded.uid);

      next();
    } catch (error: any) {
      console.error('WebSocket authentication failed:', error.message);
      console.error('WebSocket auth error code:', error.code);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Client connected: ${socket.id}, User: ${socket.userId}`);

    // Handle connection (join room)
    handleConnection(socket, io);

    // Handle message events
    socket.on('message', (data) => handleMessage(socket, io, data));

    // Handle typing events
    socket.on('typing', (data) => handleTyping(socket, io, data));

    // Handle finalize intake session
    socket.on('finalize', (data, callback) => handleFinalize(socket, io, data, callback));

    // Handle disconnect
    socket.on('disconnect', () => handleDisconnect(socket, io));

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('WebSocket server initialized');
  return io;
}
