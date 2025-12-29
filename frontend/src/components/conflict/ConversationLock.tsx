import React from 'react';
import './Conflict.css';

export interface ConversationLockProps {}

const ConversationLock: React.FC<ConversationLockProps> = () => {
  return (
    <div className="conversation-lock" role="status" aria-live="polite">
      <div className="conversation-lock-content">
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="conversation-lock-icon"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <div className="conversation-lock-text">
          <strong className="conversation-lock-title">Conversation finalized</strong>
          <span className="conversation-lock-description">
            This exploration is complete. No more messages can be sent.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConversationLock;
