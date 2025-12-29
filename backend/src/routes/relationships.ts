import { Router, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { getUserByFirebaseUid, getUserById, syncUser } from '../services/user';
import {
  createInvitation,
  acceptInvitation,
  getRelationship,
  getAllRelationships,
  getRelationshipById,
  setPrimaryRelationship,
  unpair,
  getPendingInvitations,
  getSentInvitations,
  getInvitationById,
  refreshInvitationExpiry,
} from '../services/relationship';
import { getPatternInsights } from '../services/prompt-builder';
import { sendInvitationEmail } from '../services/email';
import { AuthenticatedRequest, RelationshipType } from '../types';

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

    const { partnerEmail, relationshipType } = req.body;
    if (!partnerEmail) {
      res.status(400).json({ error: 'Partner email is required' });
      return;
    }

    if (partnerEmail === currentUser.email) {
      res.status(400).json({ error: 'Cannot send invitation to yourself' });
      return;
    }

    // Validate relationship type
    const validTypes: RelationshipType[] = ['partner', 'family', 'friend'];
    const type: RelationshipType = validTypes.includes(relationshipType) ? relationshipType : 'partner';

    const invitation = await createInvitation(currentUser.id, partnerEmail, type);

    // Send invitation email
    try {
      await sendInvitationEmail({
        to: partnerEmail,
        inviterName: currentUser.displayName || currentUser.email,
        inviterEmail: currentUser.email,
        token: invitation.inviteToken,
        relationshipType: type,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue anyway - invitation is created, user can share link manually
    }

    res.json({ invitation });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create invitation';
    console.error('Error creating invitation:', error);
    res.status(400).json({ error: errorMessage });
  }
});

// Resend invitation email
router.post('/resend/:invitationId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const { invitationId } = req.params;
    const invitation = await getInvitationById(invitationId);

    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    // Verify current user is the inviter
    if (invitation.inviterId !== currentUser.id) {
      res.status(403).json({ error: 'You can only resend your own invitations' });
      return;
    }

    // Verify invitation is still pending
    if (invitation.status !== 'pending') {
      res.status(400).json({ error: 'Invitation has already been accepted or expired' });
      return;
    }

    // Refresh the expiry time (extend by 72 hours)
    const updatedInvitation = await refreshInvitationExpiry(invitationId);

    // Resend the email
    try {
      await sendInvitationEmail({
        to: invitation.partnerEmail,
        inviterName: currentUser.displayName || currentUser.email,
        inviterEmail: currentUser.email,
        token: invitation.inviteToken,
        relationshipType: invitation.relationshipType || 'partner',
      });
      res.json({
        success: true,
        message: 'Invitation email resent successfully',
        invitation: updatedInvitation
      });
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError);
      res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to resend invitation';
    console.error('Error resending invitation:', error);
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

// Get sent invitations (invitations user has sent to others)
router.get('/invitations/sent', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const invitations = await getSentInvitations(currentUser.id);
    res.json({ invitations });
  } catch (error) {
    console.error('Error getting sent invitations:', error);
    res.status(500).json({ error: 'Failed to get sent invitations' });
  }
});

// Get invitation details (public - no auth required, for displaying who the invite is for)
router.get('/invitation/:token', async (req, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const { getInvitationByToken } = await import('../services/relationship');
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    if (invitation.status !== 'pending') {
      res.status(400).json({ error: 'Invitation has already been used or expired' });
      return;
    }

    // Return limited info (don't expose everything)
    res.json({
      inviterEmail: invitation.inviterEmail,
      partnerEmail: invitation.partnerEmail,
      relationshipType: invitation.relationshipType,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error('Error getting invitation:', error);
    res.status(500).json({ error: 'Failed to get invitation details' });
  }
});

// Accept invitation
router.post('/accept/:token', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Auto-sync user if they don't exist (for new users accepting invitations)
    let currentUser = await getUserByFirebaseUid(req.user.uid);
    if (!currentUser) {
      const { uid, email, name } = req.user;
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      const displayName = name || email.split('@')[0];
      currentUser = await syncUser(uid, email, displayName);
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

// Get all relationships for current user
router.get('/all', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const relationships = await getAllRelationships(currentUser.id);

    // Get partner details for each relationship
    const relationshipsWithPartners = await Promise.all(
      relationships.map(async (rel) => {
        const partnerId = rel.user1Id === currentUser.id ? rel.user2Id : rel.user1Id;
        const partner = await getUserById(partnerId);
        return {
          ...rel,
          isPrimary: rel.id === currentUser.primaryRelationshipId,
          partner: partner
            ? {
                id: partner.id,
                displayName: partner.displayName,
                email: partner.email,
              }
            : null,
        };
      })
    );

    res.json({ relationships: relationshipsWithPartners });
  } catch (error) {
    console.error('Error getting all relationships:', error);
    res.status(500).json({ error: 'Failed to get relationships' });
  }
});

// Set primary relationship
router.post('/primary/:relationshipId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const { relationshipId } = req.params;
    await setPrimaryRelationship(currentUser.id, relationshipId);

    res.json({ message: 'Primary relationship updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to set primary relationship';
    console.error('Error setting primary relationship:', error);
    res.status(400).json({ error: errorMessage });
  }
});

// Check if shared chat is unlocked for a relationship (both partners completed joint-context guidance)
router.get('/:relationshipId/shared-chat-status', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const { relationshipId } = req.params;
    const relationship = await getRelationshipById(relationshipId);

    if (!relationship) {
      res.status(404).json({ error: 'Relationship not found' });
      return;
    }

    // Verify user is part of this relationship
    if (relationship.user1Id !== currentUser.id && relationship.user2Id !== currentUser.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if there are any conflicts in this relationship where both partners have completed joint-context guidance
    const { conflictService } = await import('../services/conflict');
    const { conversationService } = await import('../services/conversation');

    // Get conflicts for this relationship
    const conflicts = await conflictService.getConflictsByRelationship(relationshipId);

    let unlocked = false;
    for (const conflict of conflicts) {
      // Check if conflict has both partners' sessions finalized
      if (conflict.partner_a_session_id && conflict.partner_b_session_id) {
        const partnerASession = await conversationService.getSession(conflict.partner_a_session_id);
        const partnerBSession = await conversationService.getSession(conflict.partner_b_session_id);

        if (partnerASession?.status === 'finalized' && partnerBSession?.status === 'finalized') {
          // Check if joint_context sessions exist for both
          const sessions = await conversationService.getSessionsByConflict(conflict.id);
          const hasJointContextA = sessions.some(s => s.sessionType === 'joint_context_a');
          const hasJointContextB = sessions.some(s => s.sessionType === 'joint_context_b');

          if (hasJointContextA && hasJointContextB) {
            unlocked = true;
            break;
          }
        }
      }
    }

    res.json({ unlocked });
  } catch (error) {
    console.error('Error checking shared chat status:', error);
    res.status(500).json({ error: 'Failed to check shared chat status' });
  }
});

// Remove a specific relationship
router.delete('/:relationshipId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

    const { relationshipId } = req.params;
    await unpair(relationshipId, currentUser.id);

    res.json({ message: 'Relationship removed successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove relationship';
    console.error('Error removing relationship:', error);
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
