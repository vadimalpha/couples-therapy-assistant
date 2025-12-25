import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow, { Message } from './ChatWindow';
import ParticipantBadge from './ParticipantBadge';
import { useSharedConversation } from '../../hooks/useSharedConversation';
import '../../styles/shared-chat.css';

export interface SharedRelationshipChatProps {
  relationshipId?: string;
}

const SharedRelationshipChat: React.FC<SharedRelationshipChatProps> = ({ relationshipId: propRelationshipId }) => {
  const { id: paramRelationshipId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const relationshipId = propRelationshipId || paramRelationshipId;

  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.error('No user ID found');
      navigate('/login');
    }
  }, [navigate]);

  const {
    messages,
    participants,
    sendMessage,
    setTyping,
    isStreaming,
    isConnected,
    isFinalized,
    error,
    currentUserRole
  } = useSharedConversation(relationshipId || '', userId);

  if (!relationshipId) {
    return (
      <div className="shared-chat-error">
        <p>Invalid relationship ID</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="shared-chat-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !isConnected) {
    return (
      <div className="shared-chat-error">
        <h2>Connection Error</h2>
        <p>Failed to connect to shared conversation.</p>
        <p>{error.message}</p>
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
    senderName: msg.senderName
  }));

  const typingParticipants = participants.filter(p => p.isTyping && p.id !== userId);
  const typingUser = typingParticipants.length > 0 ? typingParticipants[0].name : undefined;

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  return (
    <div className="shared-relationship-chat">
      <div className="shared-chat-header">
        <h1 className="shared-chat-title">Shared Relationship Conversation</h1>
        <div className="shared-chat-participants">
          {participants.map(participant => (
            <ParticipantBadge
              key={participant.id}
              name={participant.name}
              isOnline={participant.isOnline}
              variant={participant.role}
            />
          ))}
        </div>
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
            This is a shared space where both partners can communicate together with AI guidance.
            All messages are visible to both of you, promoting open and honest dialogue.
          </p>
        </div>

        <ChatWindow
          messages={chatMessages}
          onSend={handleSendMessage}
          onTyping={handleTyping}
          isTyping={isStreaming || typingParticipants.length > 0}
          typingUser={isStreaming ? 'AI Therapist' : typingUser}
          title="Shared Conversation"
          status={isFinalized ? 'finalized' : 'active'}
          participants={participants.map(p => ({
            id: p.id,
            name: p.name
          }))}
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
