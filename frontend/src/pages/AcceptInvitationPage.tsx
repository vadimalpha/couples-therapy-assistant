import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './AcceptInvitationPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface InvitationDetails {
  inviterEmail: string;
  partnerEmail: string;
  relationshipType: string;
  expiresAt: string;
}

const AcceptInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [status, setStatus] = useState<'loading' | 'ready' | 'email_mismatch' | 'accepting' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);

  // Fetch invitation details first
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/relationships/invitation/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load invitation');
          setStatus('error');
          return;
        }

        setInvitation(data);
      } catch (err) {
        setError('Failed to load invitation details');
        setStatus('error');
      }
    };

    fetchInvitation();
  }, [token]);

  // Normalize email by removing +alias part (vadim+test@example.com -> vadim@example.com)
  const normalizeEmail = (email: string): string => {
    const [local, domain] = email.toLowerCase().split('@');
    const normalizedLocal = local.split('+')[0];
    return `${normalizedLocal}@${domain}`;
  };

  // Check if user needs to login/signup or if email matches
  useEffect(() => {
    if (!authLoading && invitation) {
      if (!user) {
        // Store token in session storage so we can return after auth
        if (token) {
          sessionStorage.setItem('pendingInvitationToken', token);
        }
        navigate('/signup', { state: { returnTo: `/accept-invitation/${token}` } });
      } else if (normalizeEmail(user.email || '') !== normalizeEmail(invitation.partnerEmail)) {
        // Email mismatch - user is logged in as wrong account
        setStatus('email_mismatch');
      } else {
        setStatus('ready');
      }
    }
  }, [authLoading, user, invitation, token, navigate]);

  const handleLogoutAndSwitch = async () => {
    if (token) {
      sessionStorage.setItem('pendingInvitationToken', token);
    }
    await signOut();
    navigate('/signup', { state: { returnTo: `/accept-invitation/${token}` } });
  };

  const handleAccept = async () => {
    if (!token || !user) return;

    setStatus('accepting');
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/relationships/accept/${token}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setStatus('success');
      sessionStorage.removeItem('pendingInvitationToken');

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      setStatus('error');
    }
  };

  const handleDecline = () => {
    sessionStorage.removeItem('pendingInvitationToken');
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="accept-invitation-page">
        <div className="invitation-card">
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signup
  }

  return (
    <div className="accept-invitation-page">
      <div className="invitation-card">
        {status === 'loading' && (
          <>
            <div className="loading-spinner" />
            <p>Loading invitation...</p>
          </>
        )}

        {status === 'ready' && invitation && (
          <>
            <div className="invitation-icon">💌</div>
            <h1>You've Been Invited!</h1>
            <p className="invitation-message">
              <strong>{invitation.inviterEmail}</strong> has invited you to connect as their {invitation.relationshipType} on Couples Therapy Assistant.
            </p>
            <p className="invitation-detail">
              By accepting, you'll be able to work through conflicts together and receive joint guidance.
            </p>
            <div className="invitation-actions">
              <button
                className="btn-accept"
                onClick={handleAccept}
              >
                Accept Invitation
              </button>
              <button
                className="btn-decline"
                onClick={handleDecline}
              >
                Decline
              </button>
            </div>
          </>
        )}

        {status === 'email_mismatch' && invitation && (
          <>
            <div className="invitation-icon">⚠️</div>
            <h1>Wrong Account</h1>
            <p className="invitation-message">
              This invitation was sent to <strong>{invitation.partnerEmail}</strong>
            </p>
            <p className="invitation-detail">
              You're currently logged in as <strong>{user?.email}</strong>.
              Please log out and sign in or register with the correct email address.
            </p>
            <div className="invitation-actions">
              <button
                className="btn-accept"
                onClick={handleLogoutAndSwitch}
              >
                Log Out & Switch Account
              </button>
              <button
                className="btn-decline"
                onClick={handleDecline}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {status === 'accepting' && (
          <>
            <div className="loading-spinner" />
            <p>Accepting invitation...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h1>You're Connected!</h1>
            <p>Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">❌</div>
            <h1>Something Went Wrong</h1>
            <p className="error-message">{error}</p>
            <div className="invitation-actions">
              <button className="btn-accept" onClick={handleAccept}>
                Try Again
              </button>
              <button className="btn-decline" onClick={handleDecline}>
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
