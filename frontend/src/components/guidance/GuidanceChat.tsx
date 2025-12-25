import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWindow, { Message } from '../chat/ChatWindow';
import { useConversation } from '../../hooks/useConversation';
import GuidanceStatus from './GuidanceStatus';
import { PatternInsights, Pattern } from '../patterns';
import './Guidance.css';

export interface GuidanceChatProps {
  conflictId: string;
  sessionId: string;
  initialGuidance?: string;
  relationshipId?: string;
}

const GuidanceChat: React.FC<GuidanceChatProps> = ({
  conflictId,
  sessionId,
  initialGuidance,
  relationshipId
}) => {
  const navigate = useNavigate();
  const [guidanceStatus, setGuidanceStatus] = useState<'pending' | 'synthesizing' | 'ready'>('synthesizing');
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [sharedChatUnlocked, setSharedChatUnlocked] = useState(false);
  const { messages, sendMessage, isStreaming, isConnected, isFinalized, error } = useConversation(sessionId);

  useEffect(() => {
    // Check if initial guidance is available
    if (initialGuidance) {
      setGuidanceStatus('ready');
    } else {
      // Poll or listen for guidance synthesis completion
      // For now, we'll assume it's synthesizing until we get the first message
      setGuidanceStatus('synthesizing');
    }

    // Fetch pattern insights and shared chat unlock status
    const fetchData = async () => {
      try {
        const patternsResponse = await fetch('/api/relationships/patterns', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (patternsResponse.ok) {
          const data = await patternsResponse.json();
          setPatterns(data.patterns || []);
        }

        // Check if shared chat is unlocked (both partners completed joint-context guidance)
        if (relationshipId) {
          const unlockResponse = await fetch(`/api/relationships/${relationshipId}/shared-chat-status`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (unlockResponse.ok) {
            const unlockData = await unlockResponse.json();
            setSharedChatUnlocked(unlockData.unlocked || false);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setPatternsLoading(false);
      }
    };

    fetchData();
  }, [initialGuidance, relationshipId]);

  useEffect(() => {
    // When first AI message arrives, mark as ready
    if (messages.length > 0 && messages[0].role === 'ai') {
      setGuidanceStatus('ready');
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleJoinSharedChat = () => {
    if (relationshipId) {
      navigate(`/relationships/${relationshipId}/shared`);
    }
  };

  // Show status while waiting for synthesis
  if (guidanceStatus !== 'ready') {
    return <GuidanceStatus status={guidanceStatus} />;
  }

  // Show error if connection failed
  if (error && !isConnected) {
    return (
      <div className="guidance-error">
        <p>Failed to connect to guidance session.</p>
        <p>{error.message}</p>
      </div>
    );
  }

  // Map conversation messages to chat format
  const chatMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role === 'ai' ? 'assistant' : msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    senderName: msg.role === 'ai' ? 'AI Therapist' : undefined
  }));

  return (
    <div className="guidance-chat">
      {chatMessages.length > 0 && chatMessages[0].role === 'assistant' && (
        <div className="guidance-initial-message" aria-label="Initial guidance from AI therapist">
          <h3 className="guidance-initial-title">Your Personalized Guidance</h3>
          <p className="guidance-initial-content">{chatMessages[0].content}</p>
        </div>
      )}

      {!patternsLoading && patterns.length > 0 && (
        <PatternInsights patterns={patterns} />
      )}

      {sharedChatUnlocked && relationshipId && (
        <div className="guidance-shared-chat-unlock">
          <div className="unlock-message">
            <h3>Ready for Joint Conversation</h3>
            <p>Both partners have completed their individual guidance. You can now join a shared conversation together.</p>
          </div>
          <button
            onClick={handleJoinSharedChat}
            className="join-shared-chat-button"
            aria-label="Join shared relationship conversation"
          >
            Join Shared Conversation
          </button>
        </div>
      )}

      <ChatWindow
        messages={chatMessages.slice(1)} // Skip initial message since we show it above
        onSend={handleSendMessage}
        isTyping={isStreaming}
        typingUser="AI Therapist"
        title="Refine Your Guidance"
        status={isFinalized ? 'finalized' : 'active'}
        disabled={!isConnected || isFinalized}
      />

      {!isConnected && (
        <div className="conversation-error" role="alert">
          Connection lost. Attempting to reconnect...
        </div>
      )}
    </div>
  );
};

export default GuidanceChat;
