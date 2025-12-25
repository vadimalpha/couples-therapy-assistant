import React, { useState, useRef, useEffect } from 'react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...'
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Handle typing indicator
    if (onTyping) {
      onTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Clear typing indicator
      if (onTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        onTyping(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="chat-input-textarea"
        rows={1}
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="chat-input-button"
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;
