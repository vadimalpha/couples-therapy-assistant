import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

export type MessageRole = 'user' | 'assistant' | 'partner-a' | 'partner-b';

export interface ChatMessageProps {
  role: MessageRole;
  content: string;
  timestamp: Date;
  senderName?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp, senderName }) => {
  const isUser = role === 'user';
  const isAI = role === 'assistant';
  const messageClass = `chat-message chat-message-${role}`;

  const formatTimestamp = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getDisplayName = (): string | null => {
    if (senderName) return senderName;
    if (role === 'assistant') return 'AI Therapist';
    if (role === 'partner-a') return 'Partner A';
    if (role === 'partner-b') return 'Partner B';
    return null;
  };

  const displayName = getDisplayName();

  return (
    <div className={messageClass}>
      <div className="message-bubble">
        {!isUser && displayName && (
          <div className="message-sender">{displayName}</div>
        )}
        <div className="message-content">
          {isAI ? (
            <MarkdownRenderer content={content} />
          ) : (
            content
          )}
        </div>
        <div className="message-timestamp">{formatTimestamp(timestamp)}</div>
      </div>
    </div>
  );
};

export default ChatMessage;
