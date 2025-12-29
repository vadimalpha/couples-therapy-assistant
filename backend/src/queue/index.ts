import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Create guidance queue for AI synthesis jobs
export const guidanceQueue = new Queue('guidance', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Queue events for monitoring
export const guidanceQueueEvents = new QueueEvents('guidance', {
  connection: redisConnection,
});

// Graceful shutdown
export async function closeQueues(): Promise<void> {
  await guidanceQueue.close();
  await guidanceQueueEvents.close();
  await redisConnection.quit();
}

// Log queue events
guidanceQueueEvents.on('completed', ({ jobId }) => {
  console.log(`Job ${jobId} completed`);
});

guidanceQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed:`, failedReason);
});

guidanceQueueEvents.on('error', (err) => {
  console.error('Queue events error:', err);
});
