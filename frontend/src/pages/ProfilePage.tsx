import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../components/conflict/Conflict.css';

interface IntakeData {
  name: string;
  relationship_duration: string;
  living_situation: string;
  communication_style_summary: string;
  conflict_triggers: string[];
  previous_patterns: string;
  relationship_goals: string[];
  completed_at: string;
  last_updated: string;
}

const ProfilePage: React.FC = () => {
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadIntakeData();
  }, []);

  const loadIntakeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/me/intake', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (response.status === 404) {
        // No intake data found
        setIntakeData(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load intake data');
      }

      const data = await response.json();
      setIntakeData(data.intakeData);
    } catch (err) {
      console.error('Error loading intake data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshIntake = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch('/api/users/me/intake-refresh', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh intake');
      }

      const data = await response.json();

      // Show message to user
      alert(data.message + '\n\n' + data.note);

      // In the future, this would navigate to a new intake conversation
      // navigate('/intake/new');
    } catch (err) {
      console.error('Error refreshing intake:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh intake');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <main id="main-content" className="conflict-start-page">
        <div className="conflict-start-container">
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="conflict-start-page">
      <div className="conflict-start-container">
        <h1 className="conflict-start-title">Your Profile</h1>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {!intakeData ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p className="conflict-start-subtitle">
              You haven't completed your intake interview yet.
            </p>
            <button
              onClick={() => navigate('/intake')}
              className="submit-button"
              style={{ marginTop: '20px' }}
            >
              Start Intake Interview
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '30px' }}>
            {/* Intake Summary */}
            <div style={{
              backgroundColor: '#f7fafc',
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                Relationship Profile
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: '500', color: '#4a5568', marginBottom: '4px' }}>
                  Partner Name
                </p>
                <p style={{ color: '#2d3748' }}>
                  {intakeData.name}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: '500', color: '#4a5568', marginBottom: '4px' }}>
                  Relationship Duration
                </p>
                <p style={{ color: '#2d3748' }}>
                  {intakeData.relationship_duration}
                </p>
              </div>

              {intakeData.living_situation && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: '500', color: '#4a5568', marginBottom: '4px' }}>
                    Living Situation
                  </p>
                  <p style={{ color: '#2d3748' }}>
                    {intakeData.living_situation}
                  </p>
                </div>
              )}

              {intakeData.communication_style_summary && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: '500', color: '#4a5568', marginBottom: '4px' }}>
                    Communication Style
                  </p>
                  <p style={{ color: '#2d3748' }}>
                    {intakeData.communication_style_summary}
                  </p>
                </div>
              )}

              {intakeData.conflict_triggers && intakeData.conflict_triggers.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: '500', color: '#4a5568', marginBottom: '8px' }}>
                    Conflict Triggers
                  </p>
                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#2d3748' }}>
                    {intakeData.conflict_triggers.map((trigger, idx) => (
                      <li key={idx}>{trigger}</li>
                    ))}
                  </ul>
                </div>
              )}

              {intakeData.relationship_goals && intakeData.relationship_goals.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: '500', color: '#4a5568', marginBottom: '8px' }}>
                    Relationship Goals
                  </p>
                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#2d3748' }}>
                    {intakeData.relationship_goals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '14px', color: '#718096' }}>
                  Last updated: {formatDate(intakeData.last_updated)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={handleRefreshIntake}
                disabled={refreshing}
                className="submit-button"
                style={{ backgroundColor: '#48bb78' }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh Intake'}
              </button>

              <button
                onClick={() => navigate('/conflicts')}
                className="submit-button"
                style={{ backgroundColor: '#667eea' }}
              >
                View Conflict History
              </button>

              <button
                onClick={() => navigate('/')}
                className="back-button"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
