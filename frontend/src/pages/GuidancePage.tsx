import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuidanceChat from '../components/guidance/GuidanceChat';
import GuidanceStatus, { GuidanceStatusType } from '../components/guidance/GuidanceStatus';
import { useAuth } from '../auth/AuthContext';
import '../components/guidance/Guidance.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  const { user } = useAuth();

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

      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await user.getIdToken();

        // Fetch conflict data
        const conflictResponse = await fetch(`${API_URL}/api/conflicts/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!conflictResponse.ok) {
          throw new Error('Failed to load conflict');
        }

        const conflictData = await conflictResponse.json();
        setConflict(conflictData.conflict || conflictData);

        // Look for user's joint context session for this conflict
        const sessionsResponse = await fetch(`${API_URL}/api/conversations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (sessionsResponse.ok) {
          const sessions = await sessionsResponse.json();
          // Normalize IDs for comparison (handle both 'conflict:xxx' and 'xxx' formats)
          const normalizeId = (cid: string | undefined) => {
            if (!cid) return '';
            return cid.startsWith('conflict:') ? cid : `conflict:${cid}`;
          };
          const targetConflictId = normalizeId(conflictData.conflict?.id || id);

          // Find joint context sessions for this conflict, preferring ones with messages
          const jointContextSessions = sessions.filter((s: any) =>
            (s.sessionType === 'joint_context_a' || s.sessionType === 'joint_context_b') &&
            normalizeId(s.conflictId) === targetConflictId
          );
          // Prefer session with messages, fall back to first match
          const jointContextSession = jointContextSessions.find((s: any) => s.messages?.length > 0)
            || jointContextSessions[0];

          if (jointContextSession && jointContextSession.messages?.length > 0) {
            // Found joint context session with guidance
            const guidanceMessage = jointContextSession.messages.find((msg: any) => msg.role === 'ai');
            setGuidanceSession({
              id: jointContextSession.id,
              status: 'ready',
              initialGuidance: guidanceMessage?.content,
              partnerACompleted: true,
              partnerBCompleted: true
            });
          } else if (conflictData.conflict?.status === 'both_finalized') {
            // Both finalized but no guidance yet - synthesizing
            setGuidanceSession({
              id: '',
              status: 'synthesizing',
              partnerACompleted: true,
              partnerBCompleted: true
            });
          } else {
            // Not all partners have finalized
            const partnerADone = !!conflictData.partnerASession?.finalizedAt;
            const partnerBDone = !!conflictData.partnerBSession?.finalizedAt;
            setGuidanceSession({
              id: '',
              status: 'pending',
              partnerACompleted: partnerADone,
              partnerBCompleted: partnerBDone
            });
          }
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
  }, [id, user]);

  if (loading) {
    return (
      <main id="main-content" className="guidance-page">
        <div className="guidance-loading">
          <p>Loading guidance...</p>
        </div>
      </main>
    );
  }

  if (error || !conflict) {
    return (
      <main id="main-content" className="guidance-page">
        <div className="guidance-error">
          <p>{error || 'Conflict not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="back-button"
            aria-label="Return to home page"
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  if (!guidanceSession) {
    return (
      <main id="main-content" className="guidance-page">
        <div className="guidance-error">
          <p>Guidance session not found</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="guidance-page">
      {/* Test button for new unified chat UI */}
      {guidanceSession.status === 'ready' && guidanceSession.id && (
        <div style={{ padding: '8px 16px', background: '#1a1a2e', borderBottom: '1px solid #333' }}>
          <button
            onClick={() => navigate(`/chat/guidance/${guidanceSession.id}`)}
            style={{
              padding: '6px 12px',
              background: '#10a37f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Try New UI (with Debug Panel)
          </button>
        </div>
      )}
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
    </main>
  );
};

export default GuidancePage;
