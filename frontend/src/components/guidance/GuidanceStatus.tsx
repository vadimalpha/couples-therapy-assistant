import React from 'react';
import './Guidance.css';

export type GuidanceStatusType = 'pending' | 'synthesizing' | 'ready';

export interface GuidanceStatusProps {
  status: GuidanceStatusType;
  partnerCompleted?: boolean;
}

const GuidanceStatus: React.FC<GuidanceStatusProps> = ({ status, partnerCompleted = false }) => {
  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.3" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ),
          title: partnerCompleted
            ? 'Waiting for Partner'
            : 'Both Partners Need to Complete Exploration',
          description: partnerCompleted
            ? 'Your partner is still working through their perspective. You\'ll be notified when guidance synthesis begins.'
            : 'Both you and your partner need to complete the exploration phase before guidance can be synthesized.',
          ariaLabel: 'Waiting for partner to complete exploration'
        };

      case 'synthesizing':
        return {
          icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          ),
          title: 'Synthesizing Guidance',
          description: 'Our AI therapist is carefully analyzing both perspectives and crafting personalized guidance to help you move forward together.',
          ariaLabel: 'AI is synthesizing guidance from both perspectives'
        };

      case 'ready':
        return {
          icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ),
          title: 'Guidance Ready',
          description: 'Your personalized guidance is ready. Review the insights and continue the conversation to refine and clarify.',
          ariaLabel: 'Guidance is ready for review'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div
      className={`guidance-status guidance-status-${status}`}
      role="status"
      aria-live="polite"
      aria-label={content.ariaLabel}
    >
      <div className="guidance-status-icon">
        {content.icon}
      </div>

      <h2 className="guidance-status-title">{content.title}</h2>

      <p className="guidance-status-description">{content.description}</p>

      {status === 'synthesizing' && (
        <div className="synthesis-progress" aria-label="Synthesis in progress">
          <div className="synthesis-spinner" />
          <span className="synthesis-text">This may take a moment...</span>
        </div>
      )}

      {status === 'pending' && !partnerCompleted && (
        <div className="waiting-indicator" aria-label="Waiting for both partners">
          <span>Waiting for both partners</span>
          <div className="waiting-dots">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}

      {status === 'pending' && partnerCompleted && (
        <div className="waiting-indicator" aria-label="Waiting for your partner">
          <span>Waiting for your partner</span>
          <div className="waiting-dots">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidanceStatus;
