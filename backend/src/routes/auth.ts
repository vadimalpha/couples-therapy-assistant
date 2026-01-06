import { Router, Response, Request } from 'express';
import { authenticateUser } from '../middleware/auth';
import { syncUser, getUserByFirebaseUid, updateUser, getUserByEmail, listAllUsers } from '../services/user';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Test login password (for admin testing)
const TEST_PASSWORD = 'password';

/**
 * Generate a test token for admin test login
 */
function generateTestToken(user: { id: string; firebaseUid: string; email: string }): string {
  const payload = {
    userId: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    timestamp: Date.now(),
  };
  return 'TEST_TOKEN:' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * POST /api/auth/test-login
 * Admin test login - allows login to any account with password "password"
 */
router.post('/test-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password !== TEST_PASSWORD) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = await getUserByEmail(email);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const token = generateTestToken(user);

    console.log(`[TEST_LOGIN] Generated token for ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ error: 'Test login failed' });
  }
});

/**
 * GET /api/auth/test-users
 * List all users for test login selection
 */
router.get('/test-users', async (req: Request, res: Response) => {
  try {
    const users = await listAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Error listing test users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

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
