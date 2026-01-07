import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../components/conflict/Conflict.css';

type SoloStyleType = 'solo_free' | 'solo_contextual' | 'solo_coached';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const NewSoloChatPage: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState<SoloStyleType>('solo_free');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          sessionType: selectedStyle
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat session');
      }

      const data = await response.json();

      // Navigate to the solo chat page with the session ID
      navigate(`/chat/solo/${data.id}`);
    } catch (err) {
      console.error('Failed to create solo chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="conflict-start-page">
      <div className="conflict-start-container">
        <h1 className="conflict-start-title">Start a Personal Chat</h1>
        <p className="conflict-start-subtitle">
          Choose how you'd like to chat. This is your private space for reflection.
        </p>

        <form onSubmit={handleSubmit} className="conflict-start-form">
          <div className="form-group">
            <fieldset className="guidance-mode-fieldset">
              <legend className="form-label">Chat Style</legend>
              <p className="guidance-mode-description">
                Select the type of conversation experience you'd like
              </p>
              <div className="guidance-mode-options">
                <label className={`guidance-mode-option ${selectedStyle === 'solo_free' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="chatStyle"
                    value="solo_free"
                    checked={selectedStyle === 'solo_free'}
                    onChange={() => setSelectedStyle('solo_free')}
                    disabled={isSubmitting}
                    className="guidance-mode-radio"
                  />
                  <span className="guidance-mode-content">
                    <span className="guidance-mode-title">Free Chat</span>
                    <span className="guidance-mode-subtitle">
                      Open conversation with no specific structure. Talk about anything on your mind.
                    </span>
                  </span>
                </label>
                <label className={`guidance-mode-option ${selectedStyle === 'solo_contextual' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="chatStyle"
                    value="solo_contextual"
                    checked={selectedStyle === 'solo_contextual'}
                    onChange={() => setSelectedStyle('solo_contextual')}
                    disabled={isSubmitting}
                    className="guidance-mode-radio"
                  />
                  <span className="guidance-mode-content">
                    <span className="guidance-mode-title">Contextual Chat</span>
                    <span className="guidance-mode-subtitle">
                      AI remembers your journey and can reference your past conversations for continuity.
                    </span>
                  </span>
                </label>
                <label className={`guidance-mode-option ${selectedStyle === 'solo_coached' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="chatStyle"
                    value="solo_coached"
                    checked={selectedStyle === 'solo_coached'}
                    onChange={() => setSelectedStyle('solo_coached')}
                    disabled={isSubmitting}
                    className="guidance-mode-radio"
                  />
                  <span className="guidance-mode-content">
                    <span className="guidance-mode-title">Guided Reflection</span>
                    <span className="guidance-mode-subtitle">
                      Structured therapeutic guidance using proven methods like CBT and solution-focused approaches.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? (
              <>
                <span className="button-spinner"></span>
                Starting...
              </>
            ) : (
              'Start Chat'
            )}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="back-button"
          disabled={isSubmitting}
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  );
};

export default NewSoloChatPage;
