import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Intake.css';

interface IntakeData {
  summary: string;
  extractedData: {
    relationshipDuration?: string;
    goals?: string[];
    challenges?: string[];
    communicationStyle?: string;
    conflictFrequency?: string;
    previousTherapy?: boolean;
    [key: string]: any;
  };
  completedAt: string;
}

const IntakeSummary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const sessionId = (location.state as any)?.sessionId;

  useEffect(() => {
    const loadIntakeSummary = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3001/api/intake/summary?userId=${user.id}${sessionId ? `&sessionId=${sessionId}` : ''}`,
          {
            headers: {
              'Authorization': `Bearer ${await user.getIdToken()}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIntakeData(data);
        } else {
          console.error('Failed to load intake summary');
        }
      } catch (error) {
        console.error('Error loading intake summary:', error);
      } finally {
        setLoading(false);
      }
    };

    loadIntakeSummary();
  }, [user, sessionId, navigate]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const response = await fetch('http://localhost:3001/api/intake/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user!.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user!.id,
          sessionId
        })
      });

      if (response.ok) {
        // Navigate to home or dashboard
        navigate('/');
      } else {
        console.error('Failed to confirm intake');
        setConfirming(false);
      }
    } catch (error) {
      console.error('Error confirming intake:', error);
      setConfirming(false);
    }
  };

  const handleContinueEditing = () => {
    navigate('/intake/chat', { state: { sessionId } });
  };

  if (loading) {
    return (
      <div className="intake-summary-loading">
        <div className="intake-loading-spinner"></div>
        <p>Loading your summary...</p>
      </div>
    );
  }

  if (!intakeData) {
    return (
      <div className="intake-summary-error">
        <div className="intake-error-icon">⚠️</div>
        <h2>No Intake Data Found</h2>
        <p>We couldn't find your intake information.</p>
        <button
          className="intake-button intake-button-primary"
          onClick={() => navigate('/intake')}
        >
          Start New Interview
        </button>
      </div>
    );
  }

  return (
    <div className="intake-summary-page">
      <div className="intake-summary-container">
        <div className="intake-summary-header">
          <div className="intake-summary-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h1 className="intake-summary-title">Thank You!</h1>
          <p className="intake-summary-subtitle">
            Here's what I've learned about you and your relationship
          </p>
        </div>

        <div className="intake-summary-content">
          <div className="intake-summary-section">
            <h2>Summary</h2>
            <p className="intake-summary-text">{intakeData.summary}</p>
          </div>

          {intakeData.extractedData && Object.keys(intakeData.extractedData).length > 0 && (
            <div className="intake-summary-section">
              <h2>Key Information</h2>
              <div className="intake-data-grid">
                {intakeData.extractedData.relationshipDuration && (
                  <div className="intake-data-item">
                    <div className="intake-data-label">Relationship Duration</div>
                    <div className="intake-data-value">{intakeData.extractedData.relationshipDuration}</div>
                  </div>
                )}

                {intakeData.extractedData.goals && intakeData.extractedData.goals.length > 0 && (
                  <div className="intake-data-item intake-data-item-full">
                    <div className="intake-data-label">Goals</div>
                    <ul className="intake-data-list">
                      {intakeData.extractedData.goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {intakeData.extractedData.challenges && intakeData.extractedData.challenges.length > 0 && (
                  <div className="intake-data-item intake-data-item-full">
                    <div className="intake-data-label">Challenges</div>
                    <ul className="intake-data-list">
                      {intakeData.extractedData.challenges.map((challenge, index) => (
                        <li key={index}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {intakeData.extractedData.communicationStyle && (
                  <div className="intake-data-item">
                    <div className="intake-data-label">Communication Style</div>
                    <div className="intake-data-value">{intakeData.extractedData.communicationStyle}</div>
                  </div>
                )}

                {intakeData.extractedData.conflictFrequency && (
                  <div className="intake-data-item">
                    <div className="intake-data-label">Conflict Frequency</div>
                    <div className="intake-data-value">{intakeData.extractedData.conflictFrequency}</div>
                  </div>
                )}

                {intakeData.extractedData.previousTherapy !== undefined && (
                  <div className="intake-data-item">
                    <div className="intake-data-label">Previous Therapy</div>
                    <div className="intake-data-value">
                      {intakeData.extractedData.previousTherapy ? 'Yes' : 'No'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="intake-summary-confirmation">
            <p className="intake-confirmation-text">
              Does this look accurate? If you'd like to make changes, you can continue editing. Otherwise, confirm to proceed.
            </p>

            <div className="intake-summary-actions">
              <button
                className="intake-button intake-button-secondary"
                onClick={handleContinueEditing}
                disabled={confirming}
              >
                Continue Editing
              </button>

              <button
                className="intake-button intake-button-primary"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? 'Confirming...' : 'Looks Good'}
              </button>
            </div>
          </div>
        </div>

        {intakeData.completedAt && (
          <div className="intake-summary-footer">
            <p className="intake-completed-time">
              Completed on {new Date(intakeData.completedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntakeSummary;
