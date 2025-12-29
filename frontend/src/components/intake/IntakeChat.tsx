import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import ChatWindow from '../chat/ChatWindow';
import type { Message } from '../chat/ChatWindow';
import './Intake.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Intake sections for progress tracking
const INTAKE_SECTIONS = [
  { id: 'basics', label: 'Relationship Basics', questionCount: 5 },
  { id: 'communication', label: 'Communication Style', questionCount: 6 },
  { id: 'friction', label: 'Common Topics', questionCount: 3 },
  { id: 'history', label: 'Relationship History', questionCount: 4 },
  { id: 'background', label: 'Background', questionCount: 3 },
  { id: 'goals', label: 'Goals', questionCount: 3 },
];

export interface IntakeChatProps {
  sessionId?: string;
}

interface IntakeSession {
  id: string;
  status: 'in_progress' | 'completed';
  currentSection: string;
  completedSections: string[];
  messageCount: number;
}

const IntakeChat: React.FC<IntakeChatProps> = ({ sessionId: _providedSessionId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isAIStreaming, setIsAIStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Initialize or resume session
  useEffect(() => {
    const initializeSession = async () => {
      if (!user || hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        setIsLoading(true);
        const token = await user.getIdToken();

        // Get or create intake session
        const response = await fetch(`${API_URL}/api/intake/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to initialize intake session');
        }

        const data = await response.json();
        setSession(data.session);

        // Load existing messages if any
        if (data.messages && data.messages.length > 0) {
          setLocalMessages(data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            senderName: msg.role === 'ai' ? 'AI Therapist' : undefined
          })));
        } else {
          // New session - trigger initial AI greeting
          await sendInitialGreeting(token, data.session.id);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing session:', err);
        setError(err instanceof Error ? err.message : 'Failed to start intake');
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [user]);

  // Send initial AI greeting for new sessions
  const sendInitialGreeting = async (token: string, sessionId: string) => {
    try {
      setIsAIStreaming(true);

      const response = await fetch(`${API_URL}/api/intake/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to start intake conversation');
      }

      // Handle SSE streaming response
      await handleStreamingResponse(response, 'ai-greeting');
    } catch (err) {
      console.error('Error sending initial greeting:', err);
      // Fallback to static greeting if API fails
      setLocalMessages([{
        id: 'ai-greeting',
        role: 'assistant',
        content: getInitialGreeting(),
        timestamp: new Date(),
        senderName: 'AI Therapist'
      }]);
    } finally {
      setIsAIStreaming(false);
    }
  };

  // Handle streaming SSE response
  const handleStreamingResponse = async (response: Response, messageId: string) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let aiContent = '';

    // Add initial empty AI message
    setLocalMessages(prev => [...prev, {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      senderName: 'AI Therapist'
    }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              aiContent += data.content;
              setLocalMessages(prev => prev.map(msg =>
                msg.id === messageId
                  ? { ...msg, content: aiContent }
                  : msg
              ));
            } else if (data.type === 'done') {
              // Update session progress if provided
              if (data.session) {
                setSession(data.session);
              }
            }
          } catch {
            // Ignore parse errors for incomplete lines
          }
        }
      }
    }
  };

  // Get initial greeting message (fallback)
  const getInitialGreeting = (): string => {
    return `Hi! I'm here to help you and your partner communicate better. Before we dive into any specific issues, I'd like to learn a bit about you and your relationship.

This isn't a test or a form to fill out—just a conversation to help me understand your situation so I can provide more personalized guidance later.

**A few things to know:**
- You can leave anytime and pick up where you left off
- Your responses are private (your partner won't see them)
- You don't need to complete this before addressing a conflict

Let's start with the basics. **How long have you and your partner been together?**`;
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!user || !session) return;

    try {
      // Add user message locally
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date()
      };
      setLocalMessages(prev => [...prev, userMessage]);

      // Get AI response
      setIsAIStreaming(true);
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/intake/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      await handleStreamingResponse(response, `ai-${Date.now()}`);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsAIStreaming(false);
    }
  };

  // Handle completing intake (or pausing for now)
  const handleComplete = async () => {
    if (!user || !session) return;

    try {
      const token = await user.getIdToken();
      await fetch(`${API_URL}/api/intake/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: session.id })
      });

      navigate('/intake/summary', { state: { sessionId: session.id } });
    } catch (err) {
      console.error('Error completing intake:', err);
    }
  };

  // Handle saving and leaving
  const handleSaveAndLeave = () => {
    // Messages are auto-saved, just navigate away
    navigate('/');
  };

  // Calculate progress
  const getProgress = (): { current: number; total: number; percentage: number } => {
    if (!session) return { current: 0, total: INTAKE_SECTIONS.length, percentage: 0 };

    const completed = session.completedSections?.length || 0;
    const total = INTAKE_SECTIONS.length;
    return {
      current: completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  };

  if (isLoading) {
    return (
      <div className="intake-chat-loading">
        <div className="intake-loading-spinner"></div>
        <p>Preparing your conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intake-chat-error">
        <div className="intake-error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  const progress = getProgress();

  return (
    <div className="intake-chat-page">
      <div className="intake-chat-header">
        <div className="intake-header-content">
          <h1 className="intake-chat-title">Getting to Know You</h1>
          <p className="intake-chat-subtitle">
            Help me understand your relationship so I can provide better guidance
          </p>
        </div>

        {/* Progress indicator */}
        <div className="intake-progress">
          <div className="intake-progress-bar">
            <div
              className="intake-progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="intake-progress-text">
            {progress.current} of {progress.total} sections
          </span>
        </div>
      </div>

      <div className="intake-chat-container">
        <ChatWindow
          messages={localMessages}
          onSend={handleSendMessage}
          isTyping={isAIStreaming}
          typingUser="AI Therapist"
          title="Intake Interview"
          status="active"
          disabled={isAIStreaming}
          placeholder="Share your thoughts..."
        />
      </div>

      <div className="intake-chat-actions">
        <div className="intake-action-buttons">
          <button
            className="btn btn-ghost"
            onClick={handleSaveAndLeave}
          >
            Save & Continue Later
          </button>

          <button
            className="btn btn-primary"
            onClick={handleComplete}
            disabled={localMessages.length < 4}
          >
            View Summary
          </button>
        </div>

        <p className="intake-help-text">
          Your progress is saved automatically. You can return anytime to continue or update your responses.
        </p>
      </div>
    </div>
  );
};

export default IntakeChat;
