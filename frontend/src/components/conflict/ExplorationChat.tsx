import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../chat/ChatWindow';
import type { Message } from '../chat/ChatWindow';
import { useConversation } from '../../hooks/useConversation';
import ReadyButton from './ReadyButton';
import ConversationLock from './ConversationLock';
import { useAuth } from '../../auth/AuthContext';
import './Conflict.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ExplorationChatProps {
  conflictId?: string;
  sessionId?: string;
}

const ExplorationChat: React.FC<ExplorationChatProps> = ({
  conflictId: conflictIdProp,
  sessionId: sessionIdProp
}) => {
  const { id: conflictIdParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const conflictId = conflictIdProp || conflictIdParam;
  // Only use sessionId from props - NEVER from location.state to avoid stale Partner A sessions
  // Always fetch conflict details to determine the correct session for the current user
  const [sessionId, _setSessionId] = useState<string | undefined>(sessionIdProp);
  const [isLoadingConflict, setIsLoadingConflict] = useState(true); // Always load to verify correct session

  const [conflictTitle, setConflictTitle] = useState('Exploration Chat');
  const [, setShowReadyConfirmation] = useState(false);

  const {
    messages: rawMessages,
    sendMessage,
    isStreaming,
    isConnected,
    finalize,
    isFinalized,
    error: conversationError
  } = useConversation(sessionId || '');

  // Convert useConversation messages to ChatWindow messages
  const messages: Message[] = rawMessages.map((msg) => ({
    id: msg.id,
    role: msg.role === 'ai' ? 'assistant' : msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    senderName: msg.role === 'ai' ? 'AI Therapist' : undefined
  }));

  // Fetch conflict details to get sessionId and redirect to UnifiedChatPage
  useEffect(() => {
    if (!conflictId) {
      console.error('Missing conflictId');
      navigate('/');
      return;
    }

    // If sessionId came from props, redirect to unified chat
    if (sessionIdProp) {
      navigate(`/chat/exploration/${sessionIdProp}?conflictId=${conflictId}`, { replace: true });
      return;
    }

    const fetchConflictDetails = async () => {
      if (!user) return;

      try {
        setIsLoadingConflict(true);
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/conflicts/${conflictId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setConflictTitle(data.conflict?.title || 'Exploration Chat');

          // Get sessionId from the conflict
          if (data.conflict) {
            // Determine which session based on current user
            const isPartnerA = data.conflict.partner_a_id === user.uid;
            const partnerASession = data.conflict.partner_a_session_id;
            const partnerBSession = data.conflict.partner_b_session_id;

            let userSession = isPartnerA ? partnerASession : partnerBSession;
            const role = isPartnerA ? 'a' : 'b';

            // If Partner B doesn't have a session yet, join the conflict to create one
            if (!userSession && !isPartnerA && data.conflict.status === 'pending_partner_b') {
              console.log('Partner B joining conflict to create session...');
              const joinResponse = await fetch(`${API_URL}/api/conflicts/${conflictId}/join`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (joinResponse.ok) {
                const joinData = await joinResponse.json();
                userSession = joinData.sessionId;
                console.log('Partner B joined successfully, session:', userSession);
              } else {
                const errorData = await joinResponse.json();
                console.error('Failed to join conflict:', errorData.error);
                navigate('/');
                return;
              }
            }

            if (userSession) {
              // Redirect to UnifiedChatPage with session info
              navigate(`/chat/exploration/${userSession}?conflictId=${conflictId}&role=${role}`, { replace: true });
              return;
            } else {
              console.error('No session found for this user in conflict');
              navigate('/');
              return;
            }
          }
        } else {
          console.error('Failed to fetch conflict details');
          navigate('/');
          return;
        }
      } catch (err) {
        console.error('Failed to fetch conflict details:', err);
        navigate('/');
      } finally {
        setIsLoadingConflict(false);
      }
    };

    fetchConflictDetails();
  }, [conflictId, navigate, user, sessionIdProp]); // Check sessionIdProp for early return

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleFinalize = async () => {
    try {
      await finalize();
      setShowReadyConfirmation(false);
    } catch (err) {
      console.error('Failed to finalize conversation:', err);
    }
  };

  if (isLoadingConflict) {
    return (
      <main id="main-content" className="exploration-chat-page">
        <div className="exploration-chat-container">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading conversation...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!conflictId || !sessionId) {
    return (
      <main id="main-content" className="exploration-chat-error">
        <p>Invalid conversation. Please start a new conversation.</p>
        <button onClick={() => navigate('/')} className="back-button" aria-label="Return to home page">
          Go Home
        </button>
      </main>
    );
  }

  return (
    <main id="main-content" className="exploration-chat-page">
      <div className="exploration-chat-container">
        <ChatWindow
          messages={messages}
          onSend={handleSendMessage}
          isTyping={isStreaming}
          typingUser="AI Therapist"
          title={conflictTitle}
          status={isFinalized ? 'finalized' : (isConnected ? 'active' : 'connecting')}
          disabled={isFinalized}
          placeholder={!isConnected ? 'Connecting...' : undefined}
        />

        {conversationError && (
          <div className="conversation-error" role="alert">
            Connection error: {conversationError.message}
          </div>
        )}

        {!isFinalized && isConnected && (
          <ReadyButton
            onReady={handleFinalize}
            disabled={messages.length === 0}
          />
        )}

        {isFinalized && <ConversationLock />}
      </div>
    </main>
  );
};

export default ExplorationChat;
