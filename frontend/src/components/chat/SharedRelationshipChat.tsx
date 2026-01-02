import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from './ChatWindow';
import type { Message } from './ChatWindow';
import { useConversation } from '../../hooks/useConversation';
import { useAuth } from '../../auth/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import '../../styles/shared-chat.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SharedRelationshipChatProps {
  conflictId?: string;
}

const SharedRelationshipChat: React.FC<SharedRelationshipChatProps> = ({ conflictId: propConflictId }) => {
  const { id: paramConflictId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const conflictId = propConflictId || paramConflictId;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch the shared session ID for this conflict
  useEffect(() => {
    const fetchSharedSession = async () => {
      if (!conflictId || !user) return;

      try {
        setLoading(true);
        setFetchError(null);

        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/conflicts/${conflictId}/shared-session`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setFetchError('Shared conversation is not yet available. Both partners must complete their individual guidance first.');
          } else {
            throw new Error('Failed to fetch shared session');
          }
          return;
        }

        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (err) {
        console.error('Error fetching shared session:', err);
        setFetchError(err instanceof Error ? err.message : 'Failed to load shared conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSession();
  }, [conflictId, user]);

  // Use the regular conversation hook once we have the session ID
  const {
    messages,
    sendMessage,
    isStreaming,
    isConnected,
    isFinalized,
    error: conversationError
  } = useConversation(sessionId || '');

  if (!conflictId) {
    return (
      <div className="shared-chat-error">
        <p>Invalid conflict ID</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shared-chat-loading">
        <p>Loading shared conversation...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="shared-chat-error">
        <h2>Not Available Yet</h2>
        <p>{fetchError}</p>
        <button
          onClick={() => navigate(`/conflicts/${conflictId}/guidance`)}
          className="shared-chat-retry-button"
        >
          Back to Guidance
        </button>
      </div>
    );
  }

  if (conversationError && !isConnected) {
    return (
      <div className="shared-chat-error">
        <h2>Connection Error</h2>
        <p>Failed to connect to shared conversation.</p>
        <p>{conversationError.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="shared-chat-retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  const chatMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role === 'ai' ? 'assistant' : msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    senderName: msg.role === 'ai' ? 'AI Therapist' : undefined
  }));

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="shared-relationship-chat">
      {/* Test button for new unified chat UI */}
      {sessionId && (
        <div style={{ padding: '8px 16px', background: '#1a1a2e', borderBottom: '1px solid #333' }}>
          <button
            onClick={() => navigate(`/chat/shared/${sessionId}`)}
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
      <div className="shared-chat-header">
        <h1 className="shared-chat-title">Shared Relationship Conversation</h1>
      </div>

      {!isConnected && (
        <div className="shared-chat-connection-warning" role="alert">
          Connecting to shared conversation...
        </div>
      )}

      <div className="shared-chat-content">
        <div className="shared-chat-intro">
          <h2>Working Together</h2>
          <p>
            This is a shared space where you can explore your relationship together with AI guidance.
            The conversation combines insights from both partners' individual reflections.
          </p>
        </div>

        {/* Show the initial synthesis message separately */}
        {chatMessages.length > 0 && chatMessages[0].role === 'assistant' && (
          <div className="guidance-initial-message" aria-label="Initial relationship guidance">
            <h3 className="guidance-initial-title">Your Relationship Guidance</h3>
            <div className="guidance-initial-content">
              <MarkdownRenderer content={chatMessages[0].content} />
            </div>
          </div>
        )}

        <ChatWindow
          messages={chatMessages.slice(1)} // Skip initial message since we show it above
          onSend={handleSendMessage}
          isTyping={isStreaming}
          typingUser="AI Therapist"
          title="Continue the Conversation"
          status={isFinalized ? 'finalized' : 'active'}
          disabled={!isConnected || isFinalized}
        />
      </div>

      {isFinalized && (
        <div className="shared-chat-finalized-notice">
          <p>This conversation has been finalized. No further messages can be sent.</p>
        </div>
      )}
    </div>
  );
};

export default SharedRelationshipChat;
