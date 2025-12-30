// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { initializeFirebase } from './middleware/auth';
import { getSecurityMiddleware } from './middleware/security';
import { apiLimiter, authLimiter } from './middleware/rate-limit';
import { initializeDatabase, closeDatabase } from './services/db';
import { initializeWebSocket } from './websocket';
import { initializeGuidanceWorker } from './queue/workers/guidance-worker';
import { closeQueues } from './queue';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import relationshipRoutes from './routes/relationships';
import conversationRoutes from './routes/conversations';
import conflictRoutes from './routes/conflicts';
import intakeRoutes from './routes/intake';
import moderationRoutes from './routes/moderation';
import adminRoutes from './routes/admin';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(getSecurityMiddleware());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// Health check endpoint (no rate limiting)
app.get('/health', async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  let dbConnected = false;

  try {
    // Check database connectivity
    const db = await import('./services/db').then(m => m.getDatabase());
    await db.query('SELECT * FROM $auth LIMIT 1');
    dbConnected = true;
  } catch (error) {
    console.error('Health check - DB connection failed:', error);
  }

  const openaiConfigured = !!process.env.OPENAI_API_KEY;
  const status = dbConnected ? 'ok' : 'degraded';
  const httpStatus = dbConnected ? 200 : 503;

  res.status(httpStatus).json({
    status,
    timestamp,
    dbConnected,
    openaiConfigured,
    version: '1.0.1'
  });
});

// API Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/relationships', apiLimiter, relationshipRoutes);
app.use('/api/conversations', apiLimiter, conversationRoutes);
app.use('/api/conflicts', apiLimiter, conflictRoutes);
app.use('/api/intake', apiLimiter, intakeRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Firebase Admin SDK
    initializeFirebase();

    // Initialize SurrealDB connection
    await initializeDatabase();

    // Initialize WebSocket server
    initializeWebSocket(httpServer);

    // Initialize guidance worker
    initializeGuidanceWorker();

    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await closeQueues();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await closeQueues();
  await closeDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;
