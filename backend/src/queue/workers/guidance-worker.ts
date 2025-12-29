import { Worker, Job } from 'bullmq';
import { redisConnection } from '../index';
import { GuidanceJob } from '../jobs';
import {
  synthesizeIndividualGuidance,
  synthesizeJointContextGuidance,
} from '../../services/chat-ai';
import { generateRelationshipSynthesis } from '../../services/ai-orchestrator';
import { conversationService } from '../../services/conversation';
import { conflictService } from '../../services/conflict';

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

      // Check if both partners now have joint-context guidance - if so, create relationship synthesis
      await maybeCreateRelationshipSynthesis(conflictId);
    } else {
      throw new Error(`Unknown job type: ${(job.data as any).type}`);
    }
  } catch (error) {
    console.error(`Error processing ${type} job:`, error);
    throw error;
  }
}

/**
 * Check if both partners have joint-context guidance and create relationship synthesis if so
 */
async function maybeCreateRelationshipSynthesis(conflictId: string): Promise<void> {
  try {
    // Get conflict details
    const conflict = await conflictService.getConflict(conflictId);
    if (!conflict) {
      console.log(`Conflict ${conflictId} not found, skipping relationship synthesis`);
      return;
    }

    // Get all sessions for this conflict
    const sessions = await conversationService.getSessionsByConflict(conflictId);

    // Check if both joint_context sessions exist
    const hasJointContextA = sessions.some(s => s.sessionType === 'joint_context_a');
    const hasJointContextB = sessions.some(s => s.sessionType === 'joint_context_b');

    if (!hasJointContextA || !hasJointContextB) {
      console.log(`Waiting for both joint-context sessions for conflict ${conflictId}`);
      return;
    }

    // Check if relationship_shared session already exists
    const hasRelationshipShared = sessions.some(s => s.sessionType === 'relationship_shared');
    if (hasRelationshipShared) {
      console.log(`Relationship shared session already exists for conflict ${conflictId}`);
      return;
    }

    // Both joint-context sessions exist - create relationship synthesis
    console.log(`Creating relationship synthesis for conflict ${conflictId}`);

    // Create the relationship_shared session (use partner A as the session owner)
    const sharedSession = await conversationService.createSession(
      conflict.partner_a_id,
      'relationship_shared',
      conflictId
    );

    // Generate the synthesis
    const synthesisResult = await generateRelationshipSynthesis({
      sessionId: sharedSession.id,
      conflictId,
      partnerAId: conflict.partner_a_id,
      partnerBId: conflict.partner_b_id || '',
    });

    // Save the synthesis as the first AI message
    await conversationService.addMessage(
      sharedSession.id,
      'ai',
      synthesisResult.content
    );

    console.log(
      `Relationship synthesis created for conflict ${conflictId}. Session: ${sharedSession.id}, Cost: $${synthesisResult.usage.totalCost.toFixed(4)}`
    );
  } catch (error) {
    console.error(`Error creating relationship synthesis for conflict ${conflictId}:`, error);
    // Don't throw - this shouldn't fail the joint_context_guidance job
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
