import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useChatSession, SessionType } from '../hooks/useChatSession';
import ChatWindow, { Message as ChatMessage } from '../components/chat/ChatWindow';
import type { SessionStatus } from '../components/chat/ChatHeader';
import { ChatModeHeader } from '../components/chat/ChatModeHeader';
import { AdminDebugPanel } from '../components/admin/AdminDebugPanel';
import ReadyButton from '../components/conflict/ReadyButton';
import './UnifiedChatPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Admin emails for debug panel
const ADMIN_EMAILS = ['vadim@cvetlo.com', 'vadim@alphapoint.com', 'claude-test@couples-app.local', 'claude-partner@couples-app.local', 'claude.test.partnera@gmail.com', 'claude.test.partnerb@gmail.com'];

interface ConflictInfo {
  id: string;
  title: string;
  description?: string;
  partnerAId: string;
  partnerBId?: string;
}

/**
 * UnifiedChatPage - Single page for all chat types
 *
 * Routes handled:
 * - /chat/intake
 * - /chat/exploration?conflictId=xxx
 * - /chat/guidance?conflictId=xxx
 * - /chat/shared?conflictId=xxx
 *
 * Features:
 * - Session resolution from conflictId
 * - Mode-specific header with instructions
 * - Chat window (reusing existing ChatWindow component)
 * - Confirmation elements based on session type
 * - Admin debug panel (for admins only)
 */
const UnifiedChatPage: React.FC = () => {
  const { sessionType: sessionTypeParam } = useParams<{ sessionType: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Session resolution state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isResolvingSession, setIsResolvingSession] = useState(true);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [userRole, setUserRole] = useState<'a' | 'b'>('a');

  // Get conflictId from query params
  const conflictId = searchParams.get('conflictId') || undefined;

  // Map URL param to SessionType
  const sessionType: SessionType = useMemo(() => {
    switch (sessionTypeParam) {
      case 'intake':
        return 'intake';
      case 'exploration':
        return userRole === 'b' ? 'individual_b' : 'individual_a';
      case 'guidance':
        return userRole === 'b' ? 'joint_context_b' : 'joint_context_a';
      case 'shared':
        return 'relationship_shared';
      default:
        return 'intake';
    }
  }, [sessionTypeParam, userRole]);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  }, [user?.email]);

  // Resolve session ID based on session type and conflict
  const resolveSession = useCallback(async () => {
    if (!user) return;

    setIsResolvingSession(true);
    setResolutionError(null);

    try {
      const token = await user.getIdToken();

      // INTAKE: Get or create user's intake session
      if (sessionTypeParam === 'intake') {
        const response = await fetch(`${API_URL}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const sessions = await response.json();
          const intakeSession = sessions.find((s: any) => s.sessionType === 'intake');

          if (intakeSession) {
            setSessionId(intakeSession.id);
          } else {
            // Create new intake session
            const createResponse = await fetch(`${API_URL}/api/conversations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ sessionType: 'intake' }),
            });

            if (createResponse.ok) {
              const newSession = await createResponse.json();
              setSessionId(newSession.id);
            } else {
              throw new Error('Failed to create intake session');
            }
          }
        }
        return;
      }

      // For other types, we need conflictId
      if (!conflictId) {
        setResolutionError('No conflict specified');
        return;
      }

      // Fetch conflict info
      const conflictResponse = await fetch(`${API_URL}/api/conflicts/${conflictId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!conflictResponse.ok) {
        throw new Error('Failed to load conflict');
      }

      const conflictData = await conflictResponse.json();
      const conflict = conflictData.conflict;

      setConflictInfo({
        id: conflict.id,
        title: conflict.title,
        description: conflict.description,
        partnerAId: conflict.partner_a_id,
        partnerBId: conflict.partner_b_id,
      });

      // Determine user's role
      const isPartnerA = conflict.partner_a_id === user.uid;
      setUserRole(isPartnerA ? 'a' : 'b');

      // EXPLORATION: Get partner's exploration session
      if (sessionTypeParam === 'exploration') {
        const partnerASession = conflict.partner_a_session_id;
        const partnerBSession = conflict.partner_b_session_id;
        let userSession = isPartnerA ? partnerASession : partnerBSession;

        // If Partner B doesn't have a session yet, join the conflict
        // Partner B can join while Partner A is still chatting (concurrent exploration)
        if (!userSession && !isPartnerA && ['partner_a_chatting', 'pending_partner_b'].includes(conflict.status)) {
          const joinResponse = await fetch(`${API_URL}/api/conflicts/${conflictId}/join`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (joinResponse.ok) {
            const joinData = await joinResponse.json();
            userSession = joinData.sessionId;
          } else {
            throw new Error('Failed to join conflict');
          }
        }

        if (userSession) {
          setSessionId(userSession);
        } else {
          throw new Error('No exploration session found');
        }
        return;
      }

      // GUIDANCE: Get user's joint_context session
      if (sessionTypeParam === 'guidance') {
        const sessionsResponse = await fetch(`${API_URL}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (sessionsResponse.ok) {
          const sessions = await sessionsResponse.json();
          const normalizeId = (cid: string | undefined) => {
            if (!cid) return '';
            return cid.startsWith('conflict:') ? cid : `conflict:${cid}`;
          };
          const targetConflictId = normalizeId(conflict.id);

          // Find joint_context session for this conflict and user's role
          const sessionTypeToFind = isPartnerA ? 'joint_context_a' : 'joint_context_b';
          const jointSession = sessions.find((s: any) =>
            s.sessionType === sessionTypeToFind &&
            normalizeId(s.conflictId) === targetConflictId
          );

          if (jointSession) {
            setSessionId(jointSession.id);
          } else {
            // Check if both partners have finalized - guidance may not be ready
            if (conflict.status !== 'both_finalized') {
              setResolutionError('Guidance is not ready yet. Both partners must complete their exploration first.');
            } else {
              setResolutionError('Guidance session not found');
            }
          }
        }
        return;
      }

      // SHARED: Get shared relationship session
      if (sessionTypeParam === 'shared') {
        const sharedResponse = await fetch(`${API_URL}/api/conflicts/${conflictId}/shared-session`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (sharedResponse.ok) {
          const sharedData = await sharedResponse.json();
          setSessionId(sharedData.sessionId);
        } else if (sharedResponse.status === 404) {
          setResolutionError('Shared conversation is not yet available. Both partners must complete their guidance first.');
        } else {
          throw new Error('Failed to load shared session');
        }
        return;
      }

    } catch (err) {
      console.error('Session resolution failed:', err);
      setResolutionError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsResolvingSession(false);
    }
  }, [user, sessionTypeParam, conflictId]);

  // Resolve session on mount and when dependencies change
  useEffect(() => {
    resolveSession();
  }, [resolveSession]);

  // Use the unified chat session hook (only when sessionId is resolved)
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
    restartWithPrompt,
    savePromptTemplate,
    clearMessages,
  } = useChatSession({
    sessionId: sessionId || '',
    sessionType,
    conflictId,
  });

  // Handle finalization for exploration sessions
  const handleFinalize = async () => {
    try {
      await finalize();
      // Navigate to guidance page after finalization
      if (conflictId) {
        navigate(`/chat/guidance?conflictId=${conflictId}`);
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
  // Note: Don't include conflict title here - it's already shown in ChatModeHeader
  const chatTitle = useMemo(() => {
    switch (sessionType) {
      case 'intake': return 'Intake Interview';
      case 'individual_a': return 'Exploration';
      case 'individual_b': return 'Exploration';
      case 'joint_context_a': return 'Guidance';
      case 'joint_context_b': return 'Guidance';
      case 'relationship_shared': return 'Partner Chat';
      default: return 'Chat';
    }
  }, [sessionType]);

  // Get session status for ChatWindow
  const sessionStatus: SessionStatus = useMemo(() => {
    if (!isConnected) return 'connecting';
    if (isFinalized) return 'finalized';
    return 'active';
  }, [isConnected, isFinalized]);

  // Loading state while resolving session
  if (isResolvingSession) {
    return (
      <div className="unified-chat-page loading">
        <div className="loading-spinner" />
        <p>Loading conversation...</p>
      </div>
    );
  }

  // Error state - session resolution failed
  if (resolutionError) {
    return (
      <div className="unified-chat-page error">
        <h2>Unable to Load Chat</h2>
        <p>{resolutionError}</p>
        <button onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  // No session resolved
  if (!sessionId) {
    return (
      <div className="unified-chat-page error">
        <h2>Session Not Found</h2>
        <p>Unable to find or create a chat session.</p>
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
        conflictTitle={conflictInfo?.title}
        conflictDescription={conflictInfo?.description}
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

export default UnifiedChatPage;
