import { Router, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { syncUser, getUserByFirebaseUid, updateUser } from '../services/user';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Sync user from Firebase to SurrealDB (called on first login or profile update)
router.post('/sync', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { uid, email, name } = req.user;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const displayName = name || email.split('@')[0];

    const user = await syncUser(uid, email, displayName);
    res.json({ user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Get current user profile
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

// Update user profile
router.patch('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentUser = await getUserByFirebaseUid(req.user.uid);

    if (!currentUser) {
      res.status(404).json({ error: 'User not found. Please sync your profile first.' });
      return;
    }

    const { displayName, email } = req.body;

    if (!displayName && !email) {
      res.status(400).json({ error: 'At least one field (displayName or email) is required' });
      return;
    }

    const updateData: { displayName?: string; email?: string } = {};
    if (displayName) updateData.displayName = displayName;
    if (email) updateData.email = email;

    const updatedUser = await updateUser(currentUser.id, updateData);
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;
