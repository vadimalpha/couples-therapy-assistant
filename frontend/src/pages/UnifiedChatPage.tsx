import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useChatSession, SessionType } from '../hooks/useChatSession';
import ChatWindow, { Message as ChatMessage } from '../components/chat/ChatWindow';
import type { SessionStatus } from '../components/chat/ChatHeader';
import { ChatModeHeader } from '../components/chat/ChatModeHeader';
import { AdminDebugPanel } from '../components/admin/AdminDebugPanel';
import ReadyButton from '../components/conflict/ReadyButton';
import './UnifiedChatPage.css';

// Admin emails for debug panel
const ADMIN_EMAILS = ['vadim@cvetlo.com', 'vadim@alphapoint.com', 'claude-test@couples-app.local', 'claude-partner@couples-app.local'];

interface ConflictInfo {
  id: string;
  title: string;
  partnerAId: string;
  partnerBId?: string;
}

/**
 * UnifiedChatPage - Single page for all chat types
 *
 * Routes handled:
 * - /chat/intake/:sessionId
 * - /chat/exploration/:sessionId
 * - /chat/guidance/:sessionId
 * - /chat/shared/:sessionId
 *
 * Features:
 * - Mode-specific header with instructions
 * - Chat window (reusing existing ChatWindow component)
 * - Confirmation elements based on session type
 * - Admin debug panel (for admins only)
 */
const UnifiedChatPage: React.FC = () => {
  const { sessionType: sessionTypeParam, sessionId } = useParams<{
    sessionType: string;
    sessionId: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [_isLoadingConflict, setIsLoadingConflict] = useState(false);

  // Map URL param to SessionType
  const sessionType: SessionType = useMemo(() => {
    switch (sessionTypeParam) {
      case 'intake':
        return 'intake';
      case 'exploration':
        // Check search params for partner role (a or b)
        const role = searchParams.get('role');
        return role === 'b' ? 'individual_b' : 'individual_a';
      case 'guidance':
        const guidanceRole = searchParams.get('role');
        return guidanceRole === 'b' ? 'joint_context_b' : 'joint_context_a';
      case 'shared':
        return 'relationship_shared';
      default:
        return 'intake';
    }
  }, [sessionTypeParam, searchParams]);

  // Conflict ID from search params (for exploration/guidance/shared)
  const conflictId = searchParams.get('conflictId') || undefined;

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  }, [user?.email]);

  // Use the unified chat session hook
  const {
    messages,
    sendMessage,
    isStreaming,
    isConnected,
    finalize,
    isFinalized,
    error,
    debugPrompt,
    refreshDebugPrompt,
  } = useChatSession({
    sessionId: sessionId || '',
    sessionType,
    conflictId,
  });

  // Fetch conflict info if conflictId is provided
  useEffect(() => {
    const fetchConflictInfo = async () => {
      if (!conflictId || !user) return;

      setIsLoadingConflict(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/conflicts/${conflictId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setConflictInfo({
            id: data.conflict.id,
            title: data.conflict.title,
            partnerAId: data.conflict.partner_a_id,
            partnerBId: data.conflict.partner_b_id,
          });
        }
      } catch (err) {
        console.error('Failed to fetch conflict info:', err);
      } finally {
        setIsLoadingConflict(false);
      }
    };

    fetchConflictInfo();
  }, [conflictId, user]);

  // Handle finalization for exploration sessions
  const handleFinalize = async () => {
    try {
      await finalize();
      // Navigate to guidance page after finalization
      if (conflictId) {
        navigate(`/conflicts/${conflictId}/guidance`);
      }
    } catch (err) {
      console.error('Failed to finalize:', err);
    }
  };

  // Map messages to ChatWindow format (convert 'ai' to 'assistant')
  const mappedMessages: ChatMessage[] = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      role: msg.role === 'ai' ? 'assistant' : msg.role as ChatMessage['role']
    }));
  }, [messages]);

  // Get chat title based on session type
  const chatTitle = useMemo(() => {
    switch (sessionType) {
      case 'intake': return 'Intake Interview';
      case 'individual_a': return conflictInfo?.title || 'Explore Your Perspective';
      case 'individual_b': return conflictInfo?.title || 'Explore Your Perspective';
      case 'joint_context_a': return 'Joint Guidance';
      case 'joint_context_b': return 'Joint Guidance';
      case 'relationship_shared': return 'Relationship Chat';
      default: return 'Chat';
    }
  }, [sessionType, conflictInfo?.title]);

  // Get session status for ChatWindow
  const sessionStatus: SessionStatus = useMemo(() => {
    if (!isConnected) return 'connecting';
    if (isFinalized) return 'finalized';
    return 'active';
  }, [isConnected, isFinalized]);

  // Loading state
  if (!sessionId) {
    return (
      <div className="unified-chat-page loading">
        <p>Invalid session</p>
      </div>
    );
  }

  // Error state
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
        conflictTitle={conflictInfo?.title}
        isFinalized={isFinalized}
      />

      {/* Main chat content */}
      <main className="unified-chat-content">
        <ChatWindow
          messages={mappedMessages}
          onSend={sendMessage}
          isTyping={isStreaming}
          disabled={isFinalized}
          title={chatTitle}
          status={sessionStatus}
        />

        {/* Chat-type-specific confirmation elements */}
        {(sessionType === 'individual_a' || sessionType === 'individual_b') &&
         !isFinalized &&
         mappedMessages.length >= 4 && (
          <div className="unified-chat-actions">
            <ReadyButton
              onReady={handleFinalize}
              disabled={isStreaming || !isConnected}
            />
          </div>
        )}
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
          onRefresh={refreshDebugPrompt}
          isLoading={isStreaming}
        />
      )}
    </div>
  );
};

export default UnifiedChatPage;
