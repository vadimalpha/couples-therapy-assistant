import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuidanceChat from '../components/guidance/GuidanceChat';
import GuidanceStatus, { GuidanceStatusType } from '../components/guidance/GuidanceStatus';
import '../components/guidance/Guidance.css';

interface ConflictData {
  id: string;
  topic: string;
  status: string;
  guidanceSessionId?: string;
}

interface GuidanceSession {
  id: string;
  status: 'pending' | 'synthesizing' | 'ready';
  initialGuidance?: string;
  partnerACompleted: boolean;
  partnerBCompleted: boolean;
}

const GuidancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictData | null>(null);
  const [guidanceSession, setGuidanceSession] = useState<GuidanceSession | null>(null);

  useEffect(() => {
    const fetchGuidanceData = async () => {
      if (!id) {
        setError('No conflict ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch conflict data
        const conflictResponse = await fetch(`/api/conflicts/${id}`, {
          credentials: 'include'
        });

        if (!conflictResponse.ok) {
          throw new Error('Failed to load conflict');
        }

        const conflictData: ConflictData = await conflictResponse.json();
        setConflict(conflictData);

        // Fetch guidance session if it exists
        if (conflictData.guidanceSessionId) {
          const sessionResponse = await fetch(`/api/guidance-sessions/${conflictData.guidanceSessionId}`, {
            credentials: 'include'
          });

          if (!sessionResponse.ok) {
            throw new Error('Failed to load guidance session');
          }

          const sessionData: GuidanceSession = await sessionResponse.json();
          setGuidanceSession(sessionData);
        } else {
          // No guidance session yet - both partners haven't completed
          setGuidanceSession({
            id: '',
            status: 'pending',
            partnerACompleted: false,
            partnerBCompleted: false
          });
        }
      } catch (err) {
        console.error('Error fetching guidance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load guidance');
      } finally {
        setLoading(false);
      }
    };

    fetchGuidanceData();
  }, [id]);

  if (loading) {
    return (
      <div className="guidance-page">
        <div className="guidance-loading">
          <p>Loading guidance...</p>
        </div>
      </div>
    );
  }

  if (error || !conflict) {
    return (
      <div className="guidance-page">
        <div className="guidance-error">
          <p>{error || 'Conflict not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="back-button"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!guidanceSession) {
    return (
      <div className="guidance-page">
        <div className="guidance-error">
          <p>Guidance session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guidance-page">
      <div className="guidance-container">
        {guidanceSession.status === 'ready' && guidanceSession.id ? (
          <GuidanceChat
            conflictId={conflict.id}
            sessionId={guidanceSession.id}
            initialGuidance={guidanceSession.initialGuidance}
          />
        ) : (
          <GuidanceStatus
            status={guidanceSession.status as GuidanceStatusType}
            partnerCompleted={guidanceSession.partnerACompleted || guidanceSession.partnerBCompleted}
          />
        )}
      </div>
    </div>
  );
};

export default GuidancePage;
