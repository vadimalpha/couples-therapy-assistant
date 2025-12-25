import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../components/intake/Intake.css';

const IntakePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasIntake, setHasIntake] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user already has intake data
    const checkIntakeStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/intake/status?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setHasIntake(data.hasIntake);
        }
      } catch (error) {
        console.error('Failed to check intake status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkIntakeStatus();
  }, [user, navigate]);

  const handleStartIntake = () => {
    navigate('/intake/chat');
  };

  const handleViewIntake = () => {
    navigate('/intake/summary');
  };

  const handleRefreshIntake = () => {
    navigate('/intake/chat');
  };

  if (loading) {
    return (
      <main id="main-content" className="intake-page intake-page-loading">
        <div className="intake-loading-spinner"></div>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main id="main-content" className="intake-page">
      <div className="intake-welcome-container">
        <div className="intake-welcome-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        <h1 className="intake-welcome-title">
          {hasIntake ? 'Welcome Back!' : 'Welcome to Your Journey'}
        </h1>

        {hasIntake ? (
          <div className="intake-existing">
            <p className="intake-welcome-description">
              We already have your intake information on file. You can view your current intake summary or start fresh with a new interview.
            </p>

            <div className="intake-buttons-group">
              <button
                className="intake-button intake-button-primary"
                onClick={handleViewIntake}
              >
                View My Intake
              </button>

              <button
                className="intake-button intake-button-secondary"
                onClick={handleRefreshIntake}
              >
                Start New Interview
              </button>
            </div>
          </div>
        ) : (
          <div className="intake-new">
            <p className="intake-welcome-description">
              Before we begin, I'd like to get to know you and your relationship better. This will help me provide more personalized guidance and support.
            </p>

            <div className="intake-info-card">
              <h3>What to Expect:</h3>
              <ul className="intake-info-list">
                <li>A friendly conversation about you and your relationship</li>
                <li>Questions about your goals and challenges</li>
                <li>About 10-15 minutes to complete</li>
                <li>You can save and continue later anytime</li>
              </ul>
            </div>

            <button
              className="intake-button intake-button-primary intake-button-large"
              onClick={handleStartIntake}
            >
              Start Interview
            </button>

            <p className="intake-privacy-note">
              Your responses are private and secure. All information is encrypted and only used to improve your therapy experience.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default IntakePage;
