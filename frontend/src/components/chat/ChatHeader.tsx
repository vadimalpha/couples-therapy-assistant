import React from 'react';

export type SessionStatus = 'active' | 'finalized';

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ChatHeaderProps {
  title: string;
  status: SessionStatus;
  participants?: Participant[];
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, status, participants = [] }) => {
  return (
    <div className="chat-header">
      <div className="chat-header-content">
        <h2 className="chat-header-title">{title}</h2>
        <span className={`chat-header-status status-${status}`}>
          {status === 'active' ? 'Active' : 'Finalized'}
        </span>
      </div>
      {participants.length > 0 && (
        <div className="chat-header-participants">
          {participants.map((participant) => (
            <div key={participant.id} className="participant">
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.name}
                  className="participant-avatar"
                />
              ) : (
                <div className="participant-avatar participant-avatar-placeholder">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="participant-name">{participant.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
