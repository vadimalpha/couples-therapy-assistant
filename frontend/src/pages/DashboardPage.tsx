import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './DashboardPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type RelationshipType = 'partner' | 'family' | 'friend';

interface Conflict {
  id: string;
  title: string;
  description?: string;
  status: 'partner_a_chatting' | 'pending_partner_b' | 'partner_b_chatting' | 'both_finalized';
  privacy: 'private' | 'shared';
  partner_a_id: string;
  partner_b_id?: string;
  partnerName?: string | null;
  partnerEmail?: string | null;
  created_at: string;
  updated_at: string;
}

interface Partner {
  id: string;
  displayName: string;
  email: string;
}

interface RelationshipWithPartner {
  id: string;
  user1Id: string;
  user2Id: string;
  type: RelationshipType;
  status: 'active' | 'pending' | 'inactive';
  isPrimary: boolean;
  partner: Partner | null;
  createdAt: string;
}

interface PendingInvitation {
  id: string;
  partnerEmail: string;
  relationshipType: RelationshipType;
  status: 'pending';
  createdAt: string;
}

interface ReceivedInvitation {
  id: string;
  inviterEmail: string;
  inviterId: string;
  relationshipType: RelationshipType;
  status: 'pending';
  createdAt: string;
  expiresAt: string;
}

interface ActionButton {
  label: string;
  to: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface ConflictItemProps {
  title: string;
  description?: string;
  partnerName?: string | null;
  meta: string;
  badge?: {
    label: string;
    variant: 'warning' | 'success' | 'info';
  };
  actionButton?: ActionButton;
  actionButtons?: ActionButton[];
}

const ConflictItem: React.FC<ConflictItemProps> = ({
  title,
  description,
  partnerName,
  meta,
  badge,
  actionButton,
  actionButtons,
}) => (
  <div className="conflict-item">
    <div className="conflict-info">
      <div className="conflict-header-row">
        <span className="conflict-title">{title}</span>
        {partnerName && <span className="conflict-partner">with {partnerName}</span>}
      </div>
      {description && (
        <div className="conflict-description">{description}</div>
      )}
      <div className="conflict-meta-row">
        <span className="conflict-meta">{meta}</span>
        {badge && (
          <span className={`badge badge-${badge.variant} badge-inline`}>{badge.label}</span>
        )}
      </div>
    </div>
    <div className="conflict-actions">
      {actionButton && (
        <Link to={actionButton.to} className={`btn btn-${actionButton.variant || 'primary'} btn-sm`}>
          {actionButton.label}
        </Link>
      )}
      {actionButtons && actionButtons.map((btn, idx) => (
        <Link key={idx} to={btn.to} className={`btn btn-${btn.variant || 'primary'} btn-sm`}>
          {btn.label}
        </Link>
      ))}
    </div>
  </div>
);

const EmptyState: React.FC<{ hasPartner: boolean }> = ({ hasPartner }) => (
  <div className="empty-state">
    <div className="empty-state-icon">💬</div>
    <h2 className="heading-3">No conflicts yet</h2>
    <p className="empty-state-text">
      {hasPartner
        ? 'When you encounter a disagreement, start here to get personalized guidance for both of you.'
        : 'Connect with your partner first to start working through conflicts together.'}
    </p>
    {hasPartner && (
      <Link to="/conflicts/new" className="btn btn-primary btn-lg">
        Start New Conflict
      </Link>
    )}
  </div>
);

const RelationshipTypeLabel: React.FC<{ type: RelationshipType }> = ({ type }) => {
  const labels: Record<RelationshipType, { label: string; emoji: string }> = {
    partner: { label: 'Partner', emoji: '💑' },
    family: { label: 'Family', emoji: '👨‍👩‍👧‍👦' },
    friend: { label: 'Friend', emoji: '🤝' },
  };
  const { label, emoji } = labels[type] || labels.partner;
  return <span className="relationship-type-label">{emoji} {label}</span>;
};

const RelationshipCard: React.FC<{
  relationship: RelationshipWithPartner;
  onSetPrimary: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onNewConflict: (id: string) => void;
  isLoading: boolean;
}> = ({ relationship, onSetPrimary, onRemove, onNewConflict, isLoading }) => {
  const partner = relationship.partner;
  if (!partner) return null;

  return (
    <div className={`relationship-card ${relationship.isPrimary ? 'is-primary' : ''}`}>
      <div className="relationship-card-header">
        <RelationshipTypeLabel type={relationship.type} />
        {relationship.isPrimary && (
          <span className="primary-badge">Primary</span>
        )}
      </div>
      <div className="relationship-card-content">
        <div className="partner-avatar">
          {partner.displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="partner-details">
          <div className="partner-name">{partner.displayName || 'Partner'}</div>
          <div className="partner-email">{partner.email}</div>
        </div>
      </div>
      <div className="relationship-card-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onNewConflict(relationship.id)}
          disabled={isLoading}
        >
          New Conflict
        </button>
        {!relationship.isPrimary && relationship.type === 'partner' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onSetPrimary(relationship.id)}
            disabled={isLoading}
          >
            Set as Primary
          </button>
        )}
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => onRemove(relationship.id)}
          disabled={isLoading}
        >
          Remove
        </button>
      </div>
    </div>
  );
};

const PendingInvitationCard: React.FC<{
  invitation: PendingInvitation;
  onResend: (invitationId: string) => Promise<void>;
  isResending: boolean;
}> = ({ invitation, onResend, isResending }) => {
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    await onResend(invitation.id);
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 3000);
  };

  return (
    <div className="relationship-card is-pending">
      <div className="relationship-card-header">
        <RelationshipTypeLabel type={invitation.relationshipType} />
        <span className="pending-badge">Pending</span>
      </div>
      <div className="relationship-card-content">
        <div className="partner-avatar pending-avatar">
          <span className="pending-icon">⏳</span>
        </div>
        <div className="partner-details">
          <div className="partner-name">Invitation Sent</div>
          <div className="partner-email">{invitation.partnerEmail}</div>
        </div>
      </div>
      <div className="pending-message">
        {resendSuccess ? (
          <span className="resend-success">✅ Invitation resent!</span>
        ) : (
          'Waiting for them to accept your invitation'
        )}
      </div>
      <div className="relationship-card-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleResend}
          disabled={isResending || resendSuccess}
        >
          {isResending ? 'Sending...' : 'Resend Email'}
        </button>
      </div>
    </div>
  );
};

const ReceivedInvitationCard: React.FC<{
  invitation: ReceivedInvitation;
  onAccept: (invitationId: string) => Promise<void>;
  onDecline: (invitationId: string) => Promise<void>;
  isProcessing: boolean;
}> = ({ invitation, onAccept, onDecline, isProcessing }) => {
  const [actionInProgress, setActionInProgress] = useState<'accept' | 'decline' | null>(null);

  const handleAccept = async () => {
    setActionInProgress('accept');
    await onAccept(invitation.id);
    setActionInProgress(null);
  };

  const handleDecline = async () => {
    setActionInProgress('decline');
    await onDecline(invitation.id);
    setActionInProgress(null);
  };

  return (
    <div className="relationship-card is-received">
      <div className="relationship-card-header">
        <RelationshipTypeLabel type={invitation.relationshipType} />
        <span className="received-badge">Invitation</span>
      </div>
      <div className="relationship-card-content">
        <div className="partner-avatar received-avatar">
          <span className="received-icon">📩</span>
        </div>
        <div className="partner-details">
          <div className="partner-name">Invitation from</div>
          <div className="partner-email">{invitation.inviterEmail}</div>
        </div>
      </div>
      <div className="received-message">
        Wants to connect as: <strong>{invitation.relationshipType}</strong>
      </div>
      <div className="relationship-card-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAccept}
          disabled={isProcessing}
        >
          {actionInProgress === 'accept' ? 'Accepting...' : 'Accept'}
        </button>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={handleDecline}
          disabled={isProcessing}
        >
          {actionInProgress === 'decline' ? 'Declining...' : 'Decline'}
        </button>
      </div>
    </div>
  );
};

const AddRelationshipCard: React.FC<{
  onInvite: (email: string, type: RelationshipType) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}> = ({ onInvite, isLoading, error, success }) => {
  const [email, setEmail] = useState('');
  const [type, setType] = useState<RelationshipType>('partner');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      await onInvite(email.trim(), type);
      if (!error) {
        setEmail('');
        setIsExpanded(false);
      }
    }
  };

  if (!isExpanded) {
    return (
      <button
        className="add-relationship-button"
        onClick={() => setIsExpanded(true)}
      >
        <span className="add-icon">+</span>
        <span>Add a person</span>
      </button>
    );
  }

  return (
    <div className="card add-relationship-card">
      <div className="card-header">
        <h3 className="heading-4">Invite Someone</h3>
        <button
          className="close-btn"
          onClick={() => setIsExpanded(false)}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="add-relationship-content">
        {success ? (
          <div className="invite-success">
            ✅ Invitation sent! They will receive an email.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="invite-form">
            <div className="form-group">
              <label htmlFor="relationship-type">Relationship Type</label>
              <select
                id="relationship-type"
                value={type}
                onChange={(e) => setType(e.target.value as RelationshipType)}
                className="form-select"
                disabled={isLoading}
              >
                <option value="partner">💑 Partner</option>
                <option value="family">👨‍👩‍👧‍👦 Family Member</option>
                <option value="friend">🤝 Friend</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="partner-email">Email Address</label>
              <input
                id="partner-email"
                type="email"
                placeholder="Enter their email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                disabled={isLoading}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
        )}
        {error && <div className="invite-error">{error}</div>}
      </div>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="dashboard-loading">
    <div className="loading-spinner" />
    <p>Loading dashboard...</p>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="dashboard-error">
    <div className="error-icon">⚠️</div>
    <p>{message}</p>
    <button onClick={onRetry} className="btn btn-secondary">
      Try Again
    </button>
  </div>
);

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getConflictBadge(status: Conflict['status'], isPartnerA: boolean): ConflictItemProps['badge'] {
  switch (status) {
    case 'partner_a_chatting':
      // Both partners can explore simultaneously
      return { label: 'Your Turn', variant: 'info' };
    case 'pending_partner_b':
      return isPartnerA
        ? { label: 'Waiting for Partner', variant: 'warning' }
        : { label: 'Your Turn', variant: 'info' };
    case 'partner_b_chatting':
      return isPartnerA
        ? { label: 'Waiting for Partner', variant: 'warning' }
        : { label: 'Your Turn', variant: 'info' };
    case 'both_finalized':
      return { label: 'Complete', variant: 'success' };
    default:
      return undefined;
  }
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [relationships, setRelationships] = useState<RelationshipWithPartner[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<ReceivedInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [inviteProcessing, setInviteProcessing] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = await user.getIdToken();

      // Fetch conflicts, relationships, sent invitations, and received invitations in parallel
      const [conflictsRes, relationshipsRes, sentInvitationsRes, receivedInvitationsRes] = await Promise.all([
        fetch(`${API_URL}/api/conflicts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/relationships/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/relationships/invitations/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/relationships/invitations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!conflictsRes.ok) {
        throw new Error('Failed to load conflicts');
      }

      const conflictsData = await conflictsRes.json();
      setConflicts(conflictsData);

      if (relationshipsRes.ok) {
        const relationshipsData = await relationshipsRes.json();
        setRelationships(relationshipsData.relationships || []);
      }

      if (sentInvitationsRes.ok) {
        const sentData = await sentInvitationsRes.json();
        setPendingInvitations(sentData.invitations || []);
      }

      if (receivedInvitationsRes.ok) {
        const receivedData = await receivedInvitationsRes.json();
        setReceivedInvitations(receivedData.invitations || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleInvite = async (email: string, type: RelationshipType) => {
    if (!user) return;

    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(false);

      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/relationships/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partnerEmail: email, relationshipType: type }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInviteSuccess(true);
      // Refresh data to show the new pending invitation
      await fetchData();
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      console.error('Error inviting:', err);
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSetPrimary = async (relationshipId: string) => {
    if (!user) return;

    try {
      setActionLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/relationships/primary/${relationshipId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set primary');
      }

      // Refresh relationships
      await fetchData();
    } catch (err) {
      console.error('Error setting primary:', err);
      setError(err instanceof Error ? err.message : 'Failed to set primary');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (relationshipId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to remove this relationship?')) return;

    try {
      setActionLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/relationships/${relationshipId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove relationship');
      }

      // Refresh relationships
      await fetchData();
    } catch (err) {
      console.error('Error removing relationship:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove relationship');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNewConflict = (relationshipId: string) => {
    navigate('/conflicts/new', { state: { relationshipId } });
  };

  const handleResendInvitation = async (invitationId: string) => {
    if (!user) return;

    try {
      setResendLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/relationships/resend/${invitationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend invitation');
      }

      // Update the invitation in the list with new expiry
      await fetchData();
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
    } finally {
      setResendLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) return;

    try {
      setInviteProcessing(true);
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/relationships/accept-by-id/${invitationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invitation');
      }

      // Refresh data to show the new relationship
      await fetchData();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setInviteProcessing(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    try {
      setInviteProcessing(true);
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/relationships/decline/${invitationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to decline invitation');
      }

      // Refresh data to remove the declined invitation
      await fetchData();
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setInviteProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <main id="main-content" className="dashboard-container">
        <LoadingState />
      </main>
    );
  }

  if (error) {
    return (
      <main id="main-content" className="dashboard-container">
        <ErrorState message={error} onRetry={fetchData} />
      </main>
    );
  }

  const inProgressConflicts = conflicts.filter(
    (c) => c.status !== 'both_finalized'
  );
  const completedConflicts = conflicts.filter(
    (c) => c.status === 'both_finalized'
  );
  const hasConflicts = conflicts.length > 0;
  const hasPartner = relationships.some(r => r.type === 'partner');

  return (
    <main id="main-content" className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="heading-2">Dashboard</h1>
        {hasPartner && (
          <Link to="/conflicts/new" className="btn btn-primary">
            + New Conflict
          </Link>
        )}
      </div>

      {/* Received Invitations Section */}
      {receivedInvitations.length > 0 && (
        <section className="dashboard-section invitations-section">
          <h2 className="section-title">Pending Invitations</h2>
          <div className="relationships-grid">
            {receivedInvitations.map((inv) => (
              <ReceivedInvitationCard
                key={inv.id}
                invitation={inv}
                onAccept={handleAcceptInvitation}
                onDecline={handleDeclineInvitation}
                isProcessing={inviteProcessing}
              />
            ))}
          </div>
        </section>
      )}

      {/* Relationships Section */}
      <section className="dashboard-section">
        <h2 className="section-title">Your Connections</h2>
        <div className="relationships-grid">
          {relationships.map((rel) => (
            <RelationshipCard
              key={rel.id}
              relationship={rel}
              onSetPrimary={handleSetPrimary}
              onRemove={handleRemove}
              onNewConflict={handleNewConflict}
              isLoading={actionLoading}
            />
          ))}
          {pendingInvitations.map((inv) => (
            <PendingInvitationCard
              key={inv.id}
              invitation={inv}
              onResend={handleResendInvitation}
              isResending={resendLoading}
            />
          ))}
          <AddRelationshipCard
            onInvite={handleInvite}
            isLoading={inviteLoading}
            error={inviteError}
            success={inviteSuccess}
          />
        </div>
      </section>

      {/* Conflicts Section */}
      {!hasConflicts ? (
        <EmptyState hasPartner={hasPartner} />
      ) : (
        <div className="dashboard-grid">
          {/* In Progress */}
          <div className="card">
            <div className="card-header">
              <h3 className="heading-4">In Progress</h3>
            </div>
            <div className="conflict-list">
              {inProgressConflicts.length === 0 ? (
                <div className="conflict-empty">No conflicts in progress</div>
              ) : (
                inProgressConflicts.map((conflict) => {
                  const isPartnerA = conflict.partner_a_id === user?.uid;
                  const buttons: ActionButton[] = [];

                  // Continue/Start button for exploration
                  if (conflict.status === 'partner_a_chatting' && isPartnerA) {
                    buttons.push({ label: 'Continue', to: `/chat/exploration?conflictId=${conflict.id}`, variant: 'primary' });
                  } else if (conflict.status === 'partner_a_chatting' && !isPartnerA) {
                    // Partner B can start immediately while Partner A is still chatting
                    buttons.push({ label: 'Start', to: `/chat/exploration?conflictId=${conflict.id}`, variant: 'primary' });
                  } else if (conflict.status === 'pending_partner_b' && !isPartnerA) {
                    buttons.push({ label: 'Start', to: `/chat/exploration?conflictId=${conflict.id}`, variant: 'primary' });
                  } else if (conflict.status === 'partner_b_chatting' && !isPartnerA) {
                    buttons.push({ label: 'Continue', to: `/chat/exploration?conflictId=${conflict.id}`, variant: 'primary' });
                  } else if (conflict.status === 'pending_partner_b' && isPartnerA) {
                    // Partner A finished, show their individual guidance
                    buttons.push({ label: 'My Guidance', to: `/chat/guidance?conflictId=${conflict.id}`, variant: 'primary' });
                  } else if (conflict.status === 'partner_b_chatting' && isPartnerA) {
                    // Partner A finished, Partner B still exploring
                    buttons.push({ label: 'My Guidance', to: `/chat/guidance?conflictId=${conflict.id}`, variant: 'outline' });
                  }

                  return (
                    <ConflictItem
                      key={conflict.id}
                      title={conflict.title}
                      description={conflict.description}
                      partnerName={conflict.partnerName}
                      meta={`Started ${formatDate(conflict.created_at)}`}
                      badge={getConflictBadge(conflict.status, isPartnerA)}
                      actionButtons={buttons}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Completed */}
          <div className="card">
            <div className="card-header">
              <h3 className="heading-4">Completed</h3>
            </div>
            <div className="conflict-list">
              {completedConflicts.length === 0 ? (
                <div className="conflict-empty">No completed conflicts</div>
              ) : (
                completedConflicts.map((conflict) => {
                  const isPartnerA = conflict.partner_a_id === user?.uid;
                  return (
                    <ConflictItem
                      key={conflict.id}
                      title={conflict.title}
                      description={conflict.description}
                      partnerName={conflict.partnerName}
                      meta={`Completed ${formatDate(conflict.updated_at)}`}
                      badge={getConflictBadge(conflict.status, isPartnerA)}
                      actionButtons={[
                        { label: 'My Guidance', to: `/chat/guidance?conflictId=${conflict.id}`, variant: 'outline' },
                        { label: 'Joint Guidance', to: `/conflicts/${conflict.id}/joint-guidance`, variant: 'outline' },
                        { label: 'Partner Chat', to: `/chat/shared?conflictId=${conflict.id}`, variant: 'primary' },
                      ]}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DashboardPage;
