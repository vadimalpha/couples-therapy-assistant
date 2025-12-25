import React from 'react';

export interface ParticipantBadgeProps {
  name: string;
  isOnline: boolean;
  avatarUrl?: string;
  variant?: 'partner-a' | 'partner-b';
}

const ParticipantBadge: React.FC<ParticipantBadgeProps> = ({
  name,
  isOnline,
  avatarUrl,
  variant = 'partner-a'
}) => {
  return (
    <div className={`participant-badge participant-badge-${variant}`}>
      <div className="participant-badge-avatar-container">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="participant-badge-avatar"
          />
        ) : (
          <div className="participant-badge-avatar participant-badge-avatar-placeholder">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className={`participant-badge-status ${isOnline ? 'status-online' : 'status-offline'}`}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      </div>
      <div className="participant-badge-info">
        <span className="participant-badge-name">{name}</span>
        <span className="participant-badge-status-text">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
};

export default ParticipantBadge;
