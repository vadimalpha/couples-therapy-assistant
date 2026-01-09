import { Router, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { getUserByFirebaseUid } from '../services/user';
import { embedIntakeData } from '../services/embeddings';
import { AuthenticatedRequest, IntakeData, User } from '../types';
import { getDatabase } from '../services/db';

/**
 * Helper to extract results from SurrealDB query response
 */
function extractQueryResult<T>(result: unknown): T[] {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return [];
  }
  if (result[0] && typeof result[0] === 'object' && 'result' in result[0]) {
    return (result[0] as { result: T[] }).result || [];
  }
  if (Array.isArray(result[0])) {
    return result[0] as T[];
  }
  return [];
}

const router = Router();

/**
 * GET /api/users/me - Get current user profile with intake data
 */
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getUserByFirebaseUid(req.user.uid);

    if (!user) {
      res.status(404).json({ error: 'User not found. Please sync your profile first.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * GET /api/users/me/intake - Get intake summary
 */
router.get('/me/intake', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getUserByFirebaseUid(req.user.uid);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.intakeData) {
      res.status(404).json({
        error: 'No intake data found',
        message: 'Please complete the intake interview first'
      });
      return;
    }

    res.json({
      intakeData: user.intakeData,
      completedAt: user.intakeData.completed_at,
      lastUpdated: user.intakeData.last_updated
    });
  } catch (error) {
    console.error('Error getting intake data:', error);
    res.status(500).json({ error: 'Failed to get intake data' });
  }
});

/**
 * PATCH /api/users/me/intake-refresh - Trigger intake refresh
 * This will create a new intake conversation and update the user's intake data
 */
router.patch('/me/intake-refresh', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getUserByFirebaseUid(req.user.uid);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // For now, just return a message that intake refresh is not yet implemented
    // This will be implemented when the intake interview flow is created
    res.json({
      message: 'Intake refresh initiated',
      note: 'Please complete a new intake interview to refresh your profile',
      // In the future, this would create a new intake conversation session
      // and redirect the user to that conversation
    });
  } catch (error) {
    console.error('Error refreshing intake:', error);
    res.status(500).json({ error: 'Failed to refresh intake' });
  }
});

/**
 * PUT /api/users/me/intake - Update or create intake data
 * This endpoint is called after completing the intake interview
 */
router.put('/me/intake', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getUserByFirebaseUid(req.user.uid);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const {
      name,
      relationship_duration,
      living_situation,
      communication_style_summary,
      conflict_triggers,
      previous_patterns,
      relationship_goals,
      intake_conversation_id
    } = req.body;

    // Validate required fields
    if (!name || !relationship_duration) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'relationship_duration']
      });
      return;
    }

    const now = new Date();
    const intakeData: IntakeData = {
      name,
      relationship_duration,
      living_situation: living_situation || '',
      communication_style_summary: communication_style_summary || '',
      conflict_triggers: conflict_triggers || [],
      previous_patterns: previous_patterns || '',
      relationship_goals: relationship_goals || [],
      intake_conversation_id: intake_conversation_id || '',
      completed_at: now,
      last_updated: now,
    };

    // Update user with intake data
    const db = getDatabase();
    const updated = await db.query(
      'UPDATE $userId MERGE { intakeData: $intakeData, updatedAt: $updatedAt }',
      {
        userId: user.id,
        intakeData,
        updatedAt: now.toISOString(),
      }
    );

    const updatedUsers = extractQueryResult<User>(updated);
    if (updatedUsers.length === 0) {
      throw new Error('Failed to update intake data');
    }

    // Generate and store embeddings for the intake data
    // Use firebaseUid to match how searchSimilar queries (via context.userId from routes)
    try {
      await embedIntakeData(user.firebaseUid, {
        name,
        relationship_duration,
        communication_style_summary,
        conflict_triggers,
        previous_patterns,
        relationship_goals,
      });
    } catch (embeddingError) {
      console.error('Error generating embeddings:', embeddingError);
      // Don't fail the request if embeddings fail
    }

    res.json({
      success: true,
      intakeData,
      message: 'Intake data saved successfully'
    });
  } catch (error) {
    console.error('Error updating intake data:', error);
    res.status(500).json({ error: 'Failed to update intake data' });
  }
});

/**
 * PATCH /api/users/me/settings - Update user settings
 * Supports updating useIntakeContext (global setting for intake context in RAG)
 */
router.patch('/me/settings', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getUserByFirebaseUid(req.user.uid);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { useIntakeContext } = req.body;

    // Validate input
    if (useIntakeContext !== undefined && typeof useIntakeContext !== 'boolean') {
      res.status(400).json({ error: 'useIntakeContext must be a boolean' });
      return;
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (useIntakeContext !== undefined) {
      updates.useIntakeContext = useIntakeContext;
    }

    // Update user
    const db = getDatabase();
    const updated = await db.query(
      'UPDATE $userId MERGE $updates',
      {
        userId: user.id,
        updates,
      }
    );

    const updatedUsers = extractQueryResult<User>(updated);
    if (updatedUsers.length === 0) {
      throw new Error('Failed to update user settings');
    }

    res.json({
      success: true,
      settings: {
        useIntakeContext: updatedUsers[0].useIntakeContext ?? true,
      },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

export default router;
