import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(getSecurityMiddleware());
app.use(cors());
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

  const status = dbConnected ? 'ok' : 'degraded';
  const httpStatus = dbConnected ? 200 : 503;

  res.status(httpStatus).json({
    status,
    timestamp,
    dbConnected,
    version: '1.0.0'
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
