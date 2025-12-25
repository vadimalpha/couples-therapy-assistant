import { Router, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { getUserByFirebaseUid, getUserById } from '../services/user';
import {
  createInvitation,
  acceptInvitation,
  getRelationship,
  unpair,
  getPendingInvitations,
} from '../services/relationship';
import { getPatternInsights } from '../services/prompt-builder';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Create invitation to pair with partner
router.post('/invite', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const { partnerEmail } = req.body;
    if (!partnerEmail) {
      res.status(400).json({ error: 'Partner email is required' });
      return;
    }

    if (partnerEmail === currentUser.email) {
      res.status(400).json({ error: 'Cannot send invitation to yourself' });
      return;
    }

    const invitation = await createInvitation(currentUser.id, partnerEmail);
    res.json({ invitation });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create invitation';
    console.error('Error creating invitation:', error);
    res.status(400).json({ error: errorMessage });
  }
});

// Get pending invitations for current user
router.get('/invitations', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const invitations = await getPendingInvitations(currentUser.id);
    res.json({ invitations });
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({ error: 'Failed to get invitations' });
  }
});

// Accept invitation
router.post('/accept/:token', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const { token } = req.params;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const relationship = await acceptInvitation(token, currentUser.id);
    res.json({ relationship });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to accept invitation';
    console.error('Error accepting invitation:', error);
    res.status(400).json({ error: errorMessage });
  }
});

// Get current relationship
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const relationship = await getRelationship(currentUser.id);

    if (!relationship) {
      res.json({ relationship: null });
      return;
    }

    // Get partner details
    const partnerId =
      relationship.user1Id === currentUser.id ? relationship.user2Id : relationship.user1Id;
    const partner = await getUserById(partnerId);

    res.json({
      relationship,
      partner: partner
        ? {
            id: partner.id,
            displayName: partner.displayName,
            email: partner.email,
          }
        : null,
    });
  } catch (error) {
    console.error('Error getting relationship:', error);
    res.status(500).json({ error: 'Failed to get relationship' });
  }
});

// Unpair from current relationship
router.delete('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    if (!currentUser.relationshipId) {
      res.status(400).json({ error: 'User does not have an active relationship' });
      return;
    }

    await unpair(currentUser.relationshipId, currentUser.id);
    res.json({ message: 'Successfully unpaired from relationship' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to unpair';
    console.error('Error unpairing:', error);
    res.status(400).json({ error: errorMessage });
  }
});

// Get pattern insights for current relationship
router.get('/patterns', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    if (!currentUser.relationshipId) {
      res.status(400).json({ error: 'User does not have an active relationship' });
      return;
    }

    const patterns = await getPatternInsights(currentUser.relationshipId);
    res.json({ patterns });
  } catch (error) {
    console.error('Error getting pattern insights:', error);
    res.status(500).json({ error: 'Failed to get pattern insights' });
  }
});

export default router;
