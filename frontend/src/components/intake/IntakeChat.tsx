import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import ChatWindow, { Message } from '../chat/ChatWindow';
import { useConversation } from '../../hooks/useConversation';
import './Intake.css';

export interface IntakeChatProps {
  sessionId?: string;
}

const IntakeChat: React.FC<IntakeChatProps> = ({ sessionId: providedSessionId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>(providedSessionId || '');
  const [isReady, setIsReady] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const {
    messages,
    sendMessage,
    isStreaming,
    isConnected,
    finalize,
    isFinalized,
    error
  } = useConversation(sessionId);

  useEffect(() => {
    // Initialize or resume session
    const initializeSession = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // If no session ID provided, create a new one or resume existing
      if (!providedSessionId) {
        try {
          const response = await fetch('http://localhost:3001/api/intake/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`
            },
            body: JSON.stringify({ userId: user.id })
          });

          if (response.ok) {
            const data = await response.json();
            setSessionId(data.sessionId);
          } else {
            console.error('Failed to create session');
          }
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    };

    initializeSession();
  }, [user, providedSessionId, navigate]);

  // Convert useConversation messages to ChatWindow format
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
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      await finalize();
      // Navigate to summary page
      navigate('/intake/summary', { state: { sessionId } });
    } catch (error) {
      console.error('Failed to finalize intake:', error);
      setIsFinalizing(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="intake-chat-loading">
        <div className="intake-loading-spinner"></div>
        <p>Preparing your interview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intake-chat-error">
        <div className="intake-error-icon">⚠️</div>
        <h2>Connection Error</h2>
        <p>{error.message}</p>
        <button
          className="intake-button intake-button-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="intake-chat-page">
      <div className="intake-chat-header">
        <h1 className="intake-chat-title">Getting to Know You</h1>
        <p className="intake-chat-subtitle">
          Take your time - we'll save your progress automatically
        </p>
      </div>

      <div className="intake-chat-container">
        <ChatWindow
          messages={chatMessages}
          onSend={handleSendMessage}
          isTyping={isStreaming}
          typingUser="AI Therapist"
          title="Intake Interview"
          status={isFinalized ? 'finalized' : 'active'}
          disabled={isFinalized || isFinalizing}
        />
      </div>

      <div className="intake-chat-actions">
        {!isFinalized && (
          <div className="intake-ready-section">
            <label className="intake-ready-checkbox">
              <input
                type="checkbox"
                checked={isReady}
                onChange={(e) => setIsReady(e.target.checked)}
                disabled={isFinalizing}
              />
              <span>I'm ready to complete the interview</span>
            </label>

            <button
              className="intake-button intake-button-primary"
              onClick={handleFinalize}
              disabled={!isReady || isFinalizing || !isConnected || isStreaming}
            >
              {isFinalizing ? 'Finalizing...' : 'I\'m Ready'}
            </button>
          </div>
        )}

        <div className="intake-help-text">
          <p>
            You can leave this page anytime. Your conversation will be saved and you can continue where you left off.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntakeChat;
