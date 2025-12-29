import React, { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import type { SessionStatus, Participant } from './ChatHeader';
import ChatMessage from './ChatMessage';
import type { MessageRole } from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import './Chat.css';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  senderName?: string;
}

export interface ChatWindowProps {
  messages: Message[];
  onSend: (message: string) => void;
  isTyping?: boolean;
  typingUser?: string;
  title: string;
  status: SessionStatus;
  participants?: Participant[];
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSend,
  isTyping = false,
  typingUser,
  title,
  status,
  participants = [],
  disabled = false,
  onTyping
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="chat-window">
      <ChatHeader title={title} status={status} participants={participants} />

      <div
        ref={messagesContainerRef}
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            senderName={message.senderName}
          />
        ))}

        <TypingIndicator isTyping={isTyping} typingUser={typingUser} />

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={onSend}
        onTyping={onTyping}
        disabled={disabled || status === 'finalized'}
        placeholder={status === 'finalized' ? 'This conversation is finalized' : 'Type a message...'}
      />
    </div>
  );
};

export default ChatWindow;
