import { useState, useEffect, useCallback, useMemo } from 'react';
import { useConversation, Message } from './useConversation';
import { useAuth } from '../auth/AuthContext';

/**
 * Session types supported by the chat system
 */
export type SessionType =
  | 'intake'
  | 'individual_a'
  | 'individual_b'
  | 'joint_context_a'
  | 'joint_context_b'
  | 'solo_guidance_a'  // Solo guidance chat (without partner context)
  | 'solo_guidance_b'  // Solo guidance chat (without partner context)
  | 'relationship_shared'
  | 'solo_free'        // Personal chat - no specific structure
  | 'solo_contextual'  // Personal chat with past conversation context
  | 'solo_coached';    // Personal chat with therapeutic guidance

/**
 * Participant status for multi-user sessions
 */
export interface ParticipantStatus {
  id: string;
  name: string;
  role: 'partner-a' | 'partner-b';
  isOnline: boolean;
  isTyping: boolean;
}

/**
 * Debug prompt information for admin panel
 */
export interface DebugPromptInfo {
  logType: string;
  guidanceMode?: string;
  systemPrompt: string;
  userMessage: string;
  aiResponse: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: string;
  hasOverride?: boolean;
  // New fields for template debugging
  promptTemplate?: string | null;
  promptVariables?: Record<string, string> | null;
}

/**
 * Options for restarting a session with modified prompt
 */
export interface RestartOptions {
  template?: string;
  variableOverrides?: Record<string, string>;
}

/**
 * Options for useChatSession hook
 */
export interface UseChatSessionOptions {
  sessionId: string;
  sessionType: SessionType;
  conflictId?: string;
  onMessage?: (msg: Message) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

/**
 * Return type for useChatSession hook
 */
export interface UseChatSessionReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  isConnected: boolean;
  finalize: () => Promise<void>;
  isFinalized: boolean;
  error: Error | null;
  debugPrompt: DebugPromptInfo | null;
  refreshDebugPrompt: () => Promise<void>;
  restartWithPrompt: (systemPrompt: string, options?: RestartOptions) => Promise<{ success: boolean; error?: string }>;
  savePromptTemplate: (systemPrompt: string) => Promise<{ success: boolean; templateFile?: string; error?: string }>;
  clearMessages: () => void;
  // Multi-user specific (only for relationship_shared)
  participants: ParticipantStatus[];
  setTyping: (isTyping: boolean) => void;
  currentUserRole: 'partner-a' | 'partner-b' | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Admin emails for debug prompt access
const ADMIN_EMAILS = ['vadim@cvetlo.com', 'vadim@alphapoint.com', 'claude-test@couples-app.local', 'claude-partner@couples-app.local', 'claude.test.partnera@gmail.com', 'claude.test.partnerb@gmail.com'];

/**
 * Unified chat session hook
 *
 * This hook provides a unified interface for all chat session types:
 * - intake: User onboarding interview
 * - individual_a/b: Partner exploration sessions
 * - joint_context_a/b: Guidance refinement sessions
 * - relationship_shared: Multi-user shared conversation
 *
 * It wraps the existing useConversation hook and adds:
 * - Session type awareness
 * - Debug prompt fetching for admin panel
 * - Multi-user features for relationship_shared sessions
 */
export function useChatSession(options: UseChatSessionOptions): UseChatSessionReturn {
  const { sessionId, sessionType: _sessionType, onMessage, onStreamStart, onStreamEnd } = options;
  const { user } = useAuth();

  // Use the underlying conversation hook
  const {
    messages,
    sendMessage: baseSendMessage,
    isStreaming,
    isConnected,
    finalize,
    isFinalized,
    error,
  } = useConversation(sessionId);

  // Debug prompt state (for admin panel)
  const [debugPrompt, setDebugPrompt] = useState<DebugPromptInfo | null>(null);

  // Multi-user state (for relationship_shared)
  const [participants, _setParticipants] = useState<ParticipantStatus[]>([]);
  const [currentUserRole, _setCurrentUserRole] = useState<'partner-a' | 'partner-b' | null>(null);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  }, [user?.email]);

  // Fetch debug prompt (admin only)
  const refreshDebugPrompt = useCallback(async () => {
    if (!isAdmin || !sessionId) {
      return;
    }

    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/conversations/${sessionId}/debug-prompt`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.promptLog) {
          // Include hasOverride from top-level response
          setDebugPrompt({
            ...data.promptLog,
            hasOverride: data.hasOverride || false,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch debug prompt:', err);
    }
  }, [isAdmin, sessionId, user]);

  // Auto-fetch debug prompt on initial load and when messages change (for admins)
  useEffect(() => {
    if (isAdmin && sessionId) {
      // Fetch immediately on mount, and when messages change
      const timeout = setTimeout(refreshDebugPrompt, 500);
      return () => clearTimeout(timeout);
    }
  }, [isAdmin, sessionId, messages.length, refreshDebugPrompt]);

  // Restart session with modified prompt (admin only)
  const restartWithPrompt = useCallback(async (systemPrompt: string, options?: RestartOptions): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin || !sessionId) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const token = await user?.getIdToken();
      if (!token) return { success: false, error: 'No auth token' };

      const response = await fetch(`${API_URL}/api/conversations/${sessionId}/restart-with-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          systemPrompt,
          template: options?.template,
          variableOverrides: options?.variableOverrides,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to restart session' };
      }
    } catch (err) {
      console.error('Failed to restart with prompt:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [isAdmin, sessionId, user]);

  // Save prompt to template file (admin only)
  const savePromptTemplate = useCallback(async (systemPrompt: string): Promise<{ success: boolean; templateFile?: string; error?: string }> => {
    if (!isAdmin || !sessionId) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const token = await user?.getIdToken();
      if (!token) return { success: false, error: 'No auth token' };

      const response = await fetch(`${API_URL}/api/conversations/${sessionId}/save-prompt-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ systemPrompt }),
      });

      const data = await response.json();
      if (response.ok) {
        return { success: true, templateFile: data.templateFile };
      } else {
        return { success: false, error: data.error || 'Failed to save template' };
      }
    } catch (err) {
      console.error('Failed to save prompt template:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [isAdmin, sessionId, user]);

  // Clear messages (used when restarting chat)
  const clearMessages = useCallback(() => {
    // The messages state is managed by useConversation hook
    // We need to trigger a re-fetch of the conversation
    // This is a simple approach - reload the page or trigger state reset
    window.location.reload();
  }, []);

  // Trigger callbacks when streaming state changes
  useEffect(() => {
    if (isStreaming) {
      onStreamStart?.();
    } else {
      onStreamEnd?.();
    }
  }, [isStreaming, onStreamStart, onStreamEnd]);

  // Trigger callback when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      onMessage?.(lastMessage);
    }
  }, [messages, onMessage]);

  // Wrapped sendMessage that handles session type specifics
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // For relationship_shared, we might need to include sender info
    // The underlying hook handles this via WebSocket
    await baseSendMessage(content);
  }, [baseSendMessage]);

  // Placeholder setTyping (multi-user feature - handled by SharedRelationshipChat)
  const setTyping = useCallback((_isTyping: boolean) => {
    // This is a placeholder - multi-user typing is handled separately
    // in SharedRelationshipChat which uses useSharedConversation directly
  }, []);

  return {
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
    // Multi-user specific
    participants,
    setTyping,
    currentUserRole,
  };
}

/**
 * Helper function to determine if a session type is a single-user session
 */
export function isSingleUserSession(sessionType: SessionType): boolean {
  return ['intake', 'individual_a', 'individual_b', 'joint_context_a', 'joint_context_b', 'solo_guidance_a', 'solo_guidance_b', 'solo_free', 'solo_contextual', 'solo_coached'].includes(sessionType);
}

/**
 * Helper function to determine if a session type is a solo (personal) session
 */
export function isSoloSession(sessionType: SessionType): boolean {
  return ['solo_free', 'solo_contextual', 'solo_coached'].includes(sessionType);
}

/**
 * Helper function to determine if a session type is a multi-user session
 */
export function isMultiUserSession(sessionType: SessionType): boolean {
  return sessionType === 'relationship_shared';
}

/**
 * Helper function to get human-readable session type label
 */
export function getSessionTypeLabel(sessionType: SessionType): string {
  const labels: Record<SessionType, string> = {
    intake: 'Getting to Know You',
    individual_a: 'Your Perspective',
    individual_b: 'Your Perspective',
    joint_context_a: 'Personalized Guidance',
    joint_context_b: 'Personalized Guidance',
    solo_guidance_a: 'My Guidance',
    solo_guidance_b: 'My Guidance',
    relationship_shared: 'Together Conversation',
    solo_free: 'Personal Chat',
    solo_contextual: 'Personal Chat',
    solo_coached: 'Guided Reflection',
  };
  return labels[sessionType] || sessionType;
}

/**
 * Helper function to get session type description
 */
export function getSessionTypeDescription(sessionType: SessionType): string {
  const descriptions: Record<SessionType, string> = {
    intake: 'Share about yourself and your relationship so I can better support you.',
    individual_a: 'Describe what happened and how you feel about it.',
    individual_b: 'Describe what happened and how you feel about it.',
    joint_context_a: 'Ask questions about your personalized guidance.',
    joint_context_b: 'Ask questions about your personalized guidance.',
    solo_guidance_a: 'Explore your guidance focused on your own perspective.',
    solo_guidance_b: 'Explore your guidance focused on your own perspective.',
    relationship_shared: 'Work through this together with your partner.',
    solo_free: 'Talk about anything on your mind. No specific structure.',
    solo_contextual: 'AI remembers your journey and can reference past conversations.',
    solo_coached: 'Structured therapeutic guidance using proven methods.',
  };
  return descriptions[sessionType] || '';
}

export type { Message };
