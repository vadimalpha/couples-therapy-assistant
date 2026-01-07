import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useChatSession, SessionType } from '../hooks/useChatSession';
import ChatWindow, { Message as ChatMessage } from '../components/chat/ChatWindow';
import type { SessionStatus } from '../components/chat/ChatHeader';
import { ChatModeHeader } from '../components/chat/ChatModeHeader';
import { AdminDebugPanel } from '../components/admin/AdminDebugPanel';
import './UnifiedChatPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Admin emails for debug panel
const ADMIN_EMAILS = ['vadim@cvetlo.com', 'vadim@alphapoint.com', 'claude-test@couples-app.local', 'claude-partner@couples-app.local', 'claude.test.partnera@gmail.com', 'claude.test.partnerb@gmail.com'];

const SoloChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Session state
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  }, [user?.email]);

  // Fetch session info to get the session type
  useEffect(() => {
    const fetchSession = async () => {
      if (!user || !sessionId) return;

      setIsLoading(true);
      setLoadError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/conversations/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Chat session not found');
          } else if (response.status === 403) {
            throw new Error('Access denied');
          }
          throw new Error('Failed to load chat session');
        }

        const session = await response.json();

        // Verify it's a solo session type
        if (!['solo_free', 'solo_contextual', 'solo_coached'].includes(session.sessionType)) {
          throw new Error('Invalid session type for this page');
        }

        setSessionType(session.sessionType as SessionType);
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setLoadError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [user, sessionId]);

  // Use the chat session hook (only when session type is known)
  const {
    messages,
    sendMessage,
    isStreaming,
    isConnected,
    error,
    debugPrompt,
    refreshDebugPrompt,
    restartWithPrompt,
    savePromptTemplate,
    clearMessages,
  } = useChatSession({
    sessionId: sessionId || '',
    sessionType: sessionType || 'solo_free',
  });

  // Map messages to ChatWindow format
  const mappedMessages: ChatMessage[] = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      role: msg.role === 'ai' ? 'assistant' : msg.role as ChatMessage['role']
    }));
  }, [messages]);

  // Get chat title based on session type
  const chatTitle = useMemo(() => {
    switch (sessionType) {
      case 'solo_free': return 'Free Chat';
      case 'solo_contextual': return 'Contextual Chat';
      case 'solo_coached': return 'Guided Reflection';
      default: return 'Personal Chat';
    }
  }, [sessionType]);

  // Get session status for ChatWindow
  const sessionStatus: SessionStatus = useMemo(() => {
    if (!isConnected) return 'connecting';
    return 'active';
  }, [isConnected]);

  // Loading state
  if (isLoading) {
    return (
      <div className="unified-chat-page loading">
        <div className="loading-spinner" />
        <p>Loading conversation...</p>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="unified-chat-page error">
        <h2>Unable to Load Chat</h2>
        <p>{loadError}</p>
        <button onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  // No session type resolved
  if (!sessionType) {
    return (
      <div className="unified-chat-page error">
        <h2>Session Not Found</h2>
        <p>Unable to load the chat session.</p>
        <button onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  // Connection error state
  if (error && !isConnected) {
    return (
      <div className="unified-chat-page error">
        <h2>Connection Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="unified-chat-page">
      {/* Mode-specific header */}
      <ChatModeHeader
        sessionType={sessionType}
        isFinalized={false}
      />

      {/* Main chat content */}
      <main className="unified-chat-content">
        <ChatWindow
          messages={mappedMessages}
          onSend={sendMessage}
          isTyping={isStreaming}
          disabled={false}
          title={chatTitle}
          status={sessionStatus}
        />
      </main>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="unified-chat-status">
          <span className="status-indicator connecting" />
          <span>Connecting...</span>
        </div>
      )}

      {/* Admin debug panel */}
      {isAdmin && (
        <AdminDebugPanel
          prompt={debugPrompt}
          sessionType={sessionType}
          onRefresh={refreshDebugPrompt}
          onRestartWithPrompt={restartWithPrompt}
          onSaveTemplate={savePromptTemplate}
          onClearMessages={clearMessages}
          isLoading={isStreaming}
        />
      )}
    </div>
  );
};

export default SoloChatPage;
