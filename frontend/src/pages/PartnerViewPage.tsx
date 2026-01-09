import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './PartnerViewPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

interface ConflictData {
  id: string;
  title: string;
  privacy: 'private' | 'shared';
  partner_a_id: string;
  partner_b_id?: string;
  partner_a_session_id?: string;
  partner_b_session_id?: string;
}

/**
 * PartnerViewPage - Read-only view of partner's exploration conversation
 *
 * This page shows the partner's individual exploration chat when:
 * - The conflict has privacy='shared'
 * - Both partners have finalized their exploration
 *
 * Opens in a new tab from the guidance page header.
 */
const PartnerViewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conflictTitle, setConflictTitle] = useState<string>('');
  const [partnerLabel, setPartnerLabel] = useState<string>('Partner');

  const conflictId = searchParams.get('conflictId');

  useEffect(() => {
    const fetchPartnerConversation = async () => {
      if (!user || !conflictId) {
        setError('Missing required information');
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();

        // Fetch conflict to verify access and get partner's session
        const conflictResponse = await fetch(`${API_URL}/api/conflicts/${conflictId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!conflictResponse.ok) {
          throw new Error('Failed to load conflict');
        }

        const conflictData = await conflictResponse.json();
        const conflict: ConflictData = conflictData.conflict;

        // Check privacy
        if (conflict.privacy !== 'shared') {
          setError('This conversation is private and cannot be viewed.');
          setLoading(false);
          return;
        }

        setConflictTitle(conflict.title);

        // Determine which partner's conversation to show
        const isPartnerA = conflict.partner_a_id === user.uid;
        const partnerSessionId = isPartnerA
          ? conflict.partner_b_session_id
          : conflict.partner_a_session_id;

        setPartnerLabel(isPartnerA ? "Partner B's" : "Partner A's");

        if (!partnerSessionId) {
          setError("Partner's conversation is not available yet.");
          setLoading(false);
          return;
        }

        // Fetch partner's session messages
        const sessionResponse = await fetch(`${API_URL}/api/conversations/${partnerSessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!sessionResponse.ok) {
          throw new Error("Failed to load partner's conversation");
        }

        const sessionData = await sessionResponse.json();
        setMessages(sessionData.messages || []);

      } catch (err) {
        console.error('Error loading partner conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerConversation();
  }, [user, conflictId]);

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="partner-view-page loading">
        <div className="loading-spinner" />
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-view-page error">
        <h2>Unable to View Conversation</h2>
        <p>{error}</p>
        <button onClick={() => window.close()}>Close</button>
      </div>
    );
  }

  return (
    <div className="partner-view-page">
      <header className="partner-view-header">
        <div className="header-info">
          <h1>{partnerLabel} Exploration</h1>
          <span className="conflict-context">{conflictTitle}</span>
        </div>
        <div className="header-actions">
          <span className="read-only-badge">Read Only</span>
          <button className="close-btn" onClick={() => window.close()}>
            Close
          </button>
        </div>
      </header>

      <main className="partner-view-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages to display.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`message ${msg.role === 'ai' ? 'assistant' : 'user'}`}
            >
              <div className="message-header">
                <span className="message-role">
                  {msg.role === 'ai' ? 'AI Counselor' : 'Partner'}
                </span>
                {msg.createdAt && (
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                )}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default PartnerViewPage;
