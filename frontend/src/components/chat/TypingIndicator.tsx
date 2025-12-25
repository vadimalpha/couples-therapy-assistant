import React from 'react';

export interface TypingIndicatorProps {
  isTyping: boolean;
  typingUser?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, typingUser }) => {
  if (!isTyping) return null;

  return (
    <div className="typing-indicator">
      <div className="typing-indicator-content">
        <span className="typing-indicator-text">
          {typingUser ? `${typingUser} is typing` : 'Typing'}
        </span>
        <div className="typing-indicator-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
