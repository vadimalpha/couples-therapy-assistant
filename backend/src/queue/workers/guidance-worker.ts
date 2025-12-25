import { Worker, Job } from 'bullmq';
import { redisConnection } from '../index';
import { GuidanceJob } from '../jobs';
import {
  synthesizeIndividualGuidance,
  synthesizeJointContextGuidance,
} from '../../services/chat-ai';

/**
 * Process guidance synthesis jobs
 */
async function processGuidanceJob(job: Job<GuidanceJob>): Promise<void> {
  const { type } = job.data;

  console.log(`Processing ${type} job:`, job.id);

  try {
    if (type === 'individual_guidance') {
      const { sessionId } = job.data;
      const result = await synthesizeIndividualGuidance(sessionId);
      console.log(
        `Individual guidance synthesized for session ${sessionId}. New session: ${result.sessionId}`
      );
    } else if (type === 'joint_context_guidance') {
      const { conflictId, partnerId } = job.data;
      const result = await synthesizeJointContextGuidance(conflictId, partnerId);
      console.log(
        `Joint-context guidance synthesized for conflict ${conflictId}, partner ${partnerId}. Session: ${result.sessionId}`
      );
    } else {
      throw new Error(`Unknown job type: ${(job.data as any).type}`);
    }
  } catch (error) {
    console.error(`Error processing ${type} job:`, error);
    throw error;
  }
}

/**
 * Initialize and start the guidance worker
 */
export function initializeGuidanceWorker(): Worker {
  const worker = new Worker<GuidanceJob>('guidance', processGuidanceJob, {
    connection: redisConnection,
    concurrency: 2, // Process up to 2 jobs concurrently
  });

  // Log worker events
  worker.on('completed', (job) => {
    console.log(`Worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Worker failed job ${job?.id}:`, err);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log('Guidance worker initialized');
  return worker;
}
