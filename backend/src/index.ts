import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebase } from './middleware/auth';
import { initializeDatabase, closeDatabase } from './services/db';
import { initializeWebSocket } from './websocket';
import authRoutes from './routes/auth';
import relationshipRoutes from './routes/relationships';
import conversationRoutes from './routes/conversations';
import conflictRoutes from './routes/conflicts';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', authRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conflicts', conflictRoutes);

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
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await closeDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;
