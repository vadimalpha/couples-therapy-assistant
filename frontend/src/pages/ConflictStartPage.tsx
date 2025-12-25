import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../components/conflict/Conflict.css';

interface ConflictStartPageProps {}

const ConflictStartPage: React.FC<ConflictStartPageProps> = () => {
  const [title, setTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a title for this conversation');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          title: title.trim(),
          isPrivate
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
    <div className="conflict-start-page">
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
            <label className="privacy-toggle">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={isSubmitting}
                className="privacy-checkbox"
              />
              <span className="privacy-label">
                <span className="privacy-title">
                  {isPrivate ? 'Private' : 'Shared with partner'}
                </span>
                <span className="privacy-description">
                  {isPrivate
                    ? 'Only you can see this conversation'
                    : 'Your partner can view and participate in this conversation'
                  }
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
            disabled={isSubmitting || !title.trim()}
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
    </div>
  );
};

export default ConflictStartPage;
