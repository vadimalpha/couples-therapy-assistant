import React from 'react';
import { SessionType, getSessionTypeLabel, getSessionTypeDescription } from '../../hooks/useChatSession';
import './ChatModeHeader.css';

interface ChatModeHeaderProps {
  sessionType: SessionType;
  conflictTitle?: string;
  conflictDescription?: string;
  partnerName?: string;
  isFinalized?: boolean;
}

/**
 * ChatModeHeader displays mode-specific instructions and context
 *
 * Different modes show different headers:
 * - intake: "Getting to Know You" with onboarding instructions
 * - exploration: "Your Perspective" with conflict context
 * - guidance: "Personalized Guidance" with refinement instructions
 * - shared: "Together Conversation" with partner info
 */
export const ChatModeHeader: React.FC<ChatModeHeaderProps> = ({
  sessionType,
  conflictTitle,
  conflictDescription,
  partnerName,
  isFinalized,
}) => {
  const label = getSessionTypeLabel(sessionType);
  const description = getSessionTypeDescription(sessionType);

  // Check if this is an exploration or guidance session with a conflict
  const isConflictSession = (
    sessionType === 'individual_a' ||
    sessionType === 'individual_b' ||
    sessionType === 'joint_context_a' ||
    sessionType === 'joint_context_b'
  ) && conflictTitle;

  // Get mode-specific icon
  const getIcon = () => {
    switch (sessionType) {
      case 'intake':
        return (
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 00-16 0" />
          </svg>
        );
      case 'individual_a':
      case 'individual_b':
        return (
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        );
      case 'joint_context_a':
      case 'joint_context_b':
        return (
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'relationship_shared':
        return (
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'solo_free':
        return (
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'solo_contextual':
        return (
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'solo_coached':
        return (
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get mode tag (e.g., "Your Perspective · Exploration")
  const getModeTag = () => {
    if (sessionType === 'individual_a' || sessionType === 'individual_b') {
      return 'Your Perspective · Exploration';
    }
    if (sessionType === 'joint_context_a' || sessionType === 'joint_context_b') {
      return 'Personalized Guidance';
    }
    if (sessionType === 'relationship_shared' && partnerName) {
      return `Partner Chat · With ${partnerName}`;
    }
    return null;
  };

  // For conflict sessions, show conflict-focused layout
  if (isConflictSession) {
    return (
      <div className={`chat-mode-header mode-${sessionType}${isFinalized ? ' finalized' : ''}`}>
        <div className="mode-header-content">
          <div className="mode-icon-container">
            {getIcon()}
          </div>
          <div className="mode-text">
            <div className="conflict-title-row">
              <span className="conflict-title-main">{conflictTitle}</span>
              {conflictDescription && (
                <span className="conflict-description-inline">
                  Description: "{conflictDescription}"
                </span>
              )}
            </div>
            <span className="mode-tag">{getModeTag()}</span>
          </div>
        </div>
        {isFinalized && (
          <div className="mode-finalized-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span>Completed</span>
          </div>
        )}
      </div>
    );
  }

  // Default layout for intake and other sessions
  return (
    <div className={`chat-mode-header mode-${sessionType}${isFinalized ? ' finalized' : ''}`}>
      <div className="mode-header-content">
        <div className="mode-icon-container">
          {getIcon()}
        </div>
        <div className="mode-text">
          <h2 className="mode-title">{label}</h2>
          <p className="mode-description">{description}</p>
        </div>
      </div>
      {isFinalized && (
        <div className="mode-finalized-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" />
          </svg>
          <span>Completed</span>
        </div>
      )}
    </div>
  );
};

export default ChatModeHeader;
