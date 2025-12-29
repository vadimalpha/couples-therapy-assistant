import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../components/conflict/Conflict.css';

interface RelationshipWithPartner {
  id: string;
  type: string;
  isPrimary: boolean;
  partner: {
    id: string;
    displayName: string;
    email: string;
  } | null;
}

interface ConflictStartPageProps {}

type GuidanceMode = 'structured' | 'conversational' | 'test';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ConflictStartPage: React.FC<ConflictStartPageProps> = () => {
  const [title, setTitle] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>('conversational');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<RelationshipWithPartner[]>([]);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get pre-selected relationshipId from navigation state (from Dashboard)
  const preSelectedRelationshipId = (location.state as { relationshipId?: string } | null)?.relationshipId;

  // Fetch all user relationships on mount
  useEffect(() => {
    const fetchRelationships = async () => {
      if (!user) return;
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(`${API_URL}/api/relationships/all`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 429) {
            setFetchError('Too many requests. Please wait a moment and try again.');
          } else if (response.status === 401) {
            setFetchError('Session expired. Please log in again.');
          } else if (response.status === 404) {
            // User not synced - relationships will be empty, that's ok
            setRelationships([]);
          } else {
            const errorData = await response.json().catch(() => ({}));
            setFetchError(errorData.error || 'Failed to load relationships. Please try again.');
          }
          return;
        }

        const data = await response.json();
        const rels = data.relationships || [];
        setRelationships(rels);

        // Pre-select relationship
        if (preSelectedRelationshipId && rels.some((r: RelationshipWithPartner) => r.id === preSelectedRelationshipId)) {
          setSelectedRelationshipId(preSelectedRelationshipId);
        } else if (rels.length === 1) {
          setSelectedRelationshipId(rels[0].id);
        } else {
          // Select primary relationship if available
          const primary = rels.find((r: RelationshipWithPartner) => r.isPrimary);
          if (primary) {
            setSelectedRelationshipId(primary.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch relationships:', err);
        setFetchError('Unable to connect to server. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRelationships();
  }, [user, preSelectedRelationshipId]);

  const getRelationshipTypeLabel = (type: string | undefined): string => {
    if (!type) return 'Connection';
    switch (type) {
      case 'partner': return 'Partner';
      case 'family': return 'Family';
      case 'friend': return 'Friend';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a title for this conversation');
      return;
    }

    if (!selectedRelationshipId) {
      setError('Please select a relationship');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/conflicts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          title: title.trim(),
          privacy: isShared ? 'shared' : 'private',
          relationshipId: selectedRelationshipId,
          guidanceMode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }

      const data = await response.json();

      // Navigate to exploration chat with the new conflict ID and session ID
      navigate(`/conflicts/${data.conflictId}/explore`, {
        state: { sessionId: data.sessionId }
      });
    } catch (err) {
      console.error('Failed to create conflict:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="conflict-start-page">
      <div className="conflict-start-container">
        <h1 className="conflict-start-title">Start a New Conversation</h1>
        <p className="conflict-start-subtitle">
          Take a moment to explore what's on your mind. This is a safe space for reflection.
        </p>

        <form onSubmit={handleSubmit} className="conflict-start-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              What would you like to talk about?
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Communication challenges, Recent disagreement..."
              className="form-input"
              disabled={isSubmitting}
              maxLength={200}
              aria-required="true"
            />
            <span className="form-help-text">
              {title.length}/200 characters
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="relationship" className="form-label">
              Who is this conversation about?
            </label>
            {isLoading ? (
              <div className="form-loading">Loading relationships...</div>
            ) : fetchError ? (
              <div className="error-message" role="alert">
                {fetchError}
              </div>
            ) : relationships.length === 0 ? (
              <div className="form-warning">
                No connections found. Please <a href="/dashboard">add a connection</a> first.
              </div>
            ) : (
              <select
                id="relationship"
                value={selectedRelationshipId}
                onChange={(e) => setSelectedRelationshipId(e.target.value)}
                className="form-select"
                disabled={isSubmitting}
                aria-required="true"
              >
                <option value="">Select a relationship</option>
                {relationships.map((rel) => (
                  <option key={rel.id} value={rel.id}>
                    {getRelationshipTypeLabel(rel.type)} - {rel.partner?.displayName || rel.partner?.email || 'Unknown'}
                    {rel.isPrimary ? ' (Primary)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <fieldset className="guidance-mode-fieldset">
              <legend className="form-label">Guidance Style</legend>
              <p className="guidance-mode-description">
                Choose how you'd like to receive relationship insights
              </p>
              <div className="guidance-mode-options">
                <label className={`guidance-mode-option ${guidanceMode === 'conversational' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="guidanceMode"
                    value="conversational"
                    checked={guidanceMode === 'conversational'}
                    onChange={() => setGuidanceMode('conversational')}
                    disabled={isSubmitting}
                    className="guidance-mode-radio"
                  />
                  <span className="guidance-mode-content">
                    <span className="guidance-mode-title">Conversational</span>
                    <span className="guidance-mode-subtitle">
                      Warm, friend-like guidance. Quick, accessible advice without clinical terms.
                    </span>
                  </span>
                </label>
                <label className={`guidance-mode-option ${guidanceMode === 'structured' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="guidanceMode"
                    value="structured"
                    checked={guidanceMode === 'structured'}
                    onChange={() => setGuidanceMode('structured')}
                    disabled={isSubmitting}
                    className="guidance-mode-radio"
                  />
                  <span className="guidance-mode-content">
                    <span className="guidance-mode-title">Structured</span>
                    <span className="guidance-mode-subtitle">
                      Clinical guidance with Gottman, EFT frameworks. Best for learning therapy skills.
                    </span>
                  </span>
                </label>
                <label className={`guidance-mode-option ${guidanceMode === 'test' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="guidanceMode"
                    value="test"
                    checked={guidanceMode === 'test'}
                    onChange={() => setGuidanceMode('test')}
                    disabled={isSubmitting}
                    className="guidance-mode-radio"
                  />
                  <span className="guidance-mode-content">
                    <span className="guidance-mode-title">Test</span>
                    <span className="guidance-mode-subtitle">
                      No system guidance. Raw LLM responses for testing purposes.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
          </div>

          <div className="form-group">
            <label className="privacy-toggle">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                disabled={isSubmitting}
                className="privacy-checkbox"
              />
              <span className="privacy-label">
                <span className="privacy-title">
                  Shared with partner
                </span>
                <span className="privacy-description">
                  Your partner can view and participate in this conversation
                </span>
              </span>
            </label>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !selectedRelationshipId || relationships.length === 0 || !!fetchError}
            className="submit-button"
          >
            {isSubmitting ? (
              <>
                <span className="button-spinner"></span>
                Creating...
              </>
            ) : (
              'Start Conversation'
            )}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="back-button"
          disabled={isSubmitting}
        >
          Back to Home
        </button>
      </div>
    </main>
  );
};

export default ConflictStartPage;
