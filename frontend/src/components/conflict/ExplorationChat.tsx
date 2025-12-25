import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChatWindow from '../chat/ChatWindow';
import { Message } from '../chat/ChatWindow';
import { useConversation } from '../../hooks/useConversation';
import ReadyButton from './ReadyButton';
import ConversationLock from './ConversationLock';
import './Conflict.css';

export interface ExplorationChatProps {
  conflictId?: string;
  sessionId?: string;
}

const ExplorationChat: React.FC<ExplorationChatProps> = ({
  conflictId: conflictIdProp,
  sessionId: sessionIdProp
}) => {
  const { id: conflictIdParam } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const conflictId = conflictIdProp || conflictIdParam;
  const sessionId = sessionIdProp || location.state?.sessionId;

  const [conflictTitle, setConflictTitle] = useState('Exploration Chat');
  const [showReadyConfirmation, setShowReadyConfirmation] = useState(false);

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

  useEffect(() => {
    if (!conflictId || !sessionId) {
      console.error('Missing conflictId or sessionId');
      navigate('/');
      return;
    }

    // Fetch conflict details to get the title
    const fetchConflictDetails = async () => {
      try {
        const response = await fetch(`/api/conflicts/${conflictId}`);
        if (response.ok) {
          const data = await response.json();
          setConflictTitle(data.title || 'Exploration Chat');
        }
      } catch (err) {
        console.error('Failed to fetch conflict details:', err);
      }
    };

    fetchConflictDetails();
  }, [conflictId, sessionId, navigate]);

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

  if (!conflictId || !sessionId) {
    return (
      <div className="exploration-chat-error">
        <p>Invalid conversation. Please start a new conversation.</p>
        <button onClick={() => navigate('/')} className="back-button">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="exploration-chat-page">
      <div className="exploration-chat-container">
        <ChatWindow
          messages={messages}
          onSend={handleSendMessage}
          isTyping={isStreaming}
          typingUser="AI Therapist"
          title={conflictTitle}
          status={isFinalized ? 'finalized' : 'active'}
          disabled={isFinalized || !isConnected}
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
    </div>
  );
};

export default ExplorationChat;
