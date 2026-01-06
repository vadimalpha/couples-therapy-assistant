import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../components/guidance/Guidance.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ConflictData {
  id: string;
  title: string;
  status: string;
  partner_a_id: string;
  partner_b_id?: string;
}

interface GuidanceContent {
  partnerAGuidance?: string;
  partnerBGuidance?: string;
}

const JointGuidancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictData | null>(null);
  const [guidance, setGuidance] = useState<GuidanceContent | null>(null);
  const [isPartnerA, setIsPartnerA] = useState(false);

  useEffect(() => {
    const fetchJointGuidance = async () => {
      if (!id || !user) {
        setError('Missing conflict ID or not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await user.getIdToken();

        // Fetch conflict data
        const conflictResponse = await fetch(`${API_URL}/api/conflicts/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!conflictResponse.ok) {
          throw new Error('Failed to load conflict');
        }

        const conflictData = await conflictResponse.json();
        const conflictInfo = conflictData.conflict || conflictData;
        setConflict(conflictInfo);
        setIsPartnerA(conflictInfo.partner_a_id === user.uid);

        // Check if both partners have finalized
        if (conflictInfo.status !== 'both_finalized') {
          setError('Joint guidance is only available after both partners complete their exploration');
          setLoading(false);
          return;
        }

        // Fetch all sessions to find both partners' joint_context sessions
        const sessionsResponse = await fetch(`${API_URL}/api/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!sessionsResponse.ok) {
          throw new Error('Failed to load sessions');
        }

        const sessions = await sessionsResponse.json();

        // Normalize IDs for comparison
        const normalizeId = (cid: string | undefined) => {
          if (!cid) return '';
          return cid.startsWith('conflict:') ? cid : `conflict:${cid}`;
        };
        const targetConflictId = normalizeId(conflictInfo.id);

        // Find joint_context sessions for this conflict
        const jointContextASessions = sessions.filter((s: any) =>
          s.sessionType === 'joint_context_a' &&
          normalizeId(s.conflictId) === targetConflictId &&
          s.messages?.length > 0
        );

        const jointContextBSessions = sessions.filter((s: any) =>
          s.sessionType === 'joint_context_b' &&
          normalizeId(s.conflictId) === targetConflictId &&
          s.messages?.length > 0
        );

        // Get the first AI message from each session (the synthesized guidance)
        const partnerASession = jointContextASessions[0];
        const partnerBSession = jointContextBSessions[0];

        const partnerAGuidance = partnerASession?.messages?.find((m: any) => m.role === 'ai')?.content;
        const partnerBGuidance = partnerBSession?.messages?.find((m: any) => m.role === 'ai')?.content;

        setGuidance({
          partnerAGuidance,
          partnerBGuidance
        });

      } catch (err) {
        console.error('Error fetching joint guidance:', err);
        setError(err instanceof Error ? err.message : 'Failed to load joint guidance');
      } finally {
        setLoading(false);
      }
    };

    fetchJointGuidance();
  }, [id, user]);

  if (loading) {
    return (
      <main id="main-content" className="guidance-page">
        <div className="guidance-loading">
          <p>Loading joint guidance...</p>
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
            onClick={() => navigate('/dashboard')}
            className="back-button"
            aria-label="Return to dashboard"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="guidance-page">
      <div className="joint-guidance-container">
        <div className="joint-guidance-header">
          <h1>Joint Perspective Guidance</h1>
          <p className="joint-guidance-subtitle">
            Both partners' personalized guidance for: <strong>{conflict.title}</strong>
          </p>
        </div>

        <div className="joint-guidance-panels">
          {/* Partner A's Guidance */}
          <div className="guidance-panel">
            <div className="guidance-panel-header">
              <h2>{isPartnerA ? 'Your Guidance' : "Your Partner's Guidance"}</h2>
              <span className="partner-label">Partner A</span>
            </div>
            <div className="guidance-panel-content">
              {guidance?.partnerAGuidance ? (
                <div className="guidance-text" dangerouslySetInnerHTML={{
                  __html: guidance.partnerAGuidance
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br/>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>')
                }} />
              ) : (
                <p className="no-guidance">Guidance not yet available</p>
              )}
            </div>
          </div>

          {/* Partner B's Guidance */}
          <div className="guidance-panel">
            <div className="guidance-panel-header">
              <h2>{!isPartnerA ? 'Your Guidance' : "Your Partner's Guidance"}</h2>
              <span className="partner-label">Partner B</span>
            </div>
            <div className="guidance-panel-content">
              {guidance?.partnerBGuidance ? (
                <div className="guidance-text" dangerouslySetInnerHTML={{
                  __html: guidance.partnerBGuidance
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br/>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>')
                }} />
              ) : (
                <p className="no-guidance">Guidance not yet available</p>
              )}
            </div>
          </div>
        </div>

        <div className="joint-guidance-actions">
          <button
            onClick={() => navigate(`/chat/guidance?conflictId=${id}`)}
            className="btn btn-secondary"
          >
            Refine My Guidance
          </button>
          <button
            onClick={() => navigate(`/chat/shared?conflictId=${id}`)}
            className="btn btn-primary"
          >
            Start Partner Chat
          </button>
        </div>
      </div>
    </main>
  );
};

export default JointGuidancePage;
