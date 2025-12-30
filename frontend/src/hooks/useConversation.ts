import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';

export interface Message {
  id: string;
  role: 'user' | 'ai' | 'partner-a' | 'partner-b';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface QueuedMessage {
  content: string;
  timestamp: number;
}

interface UseConversationReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  isConnected: boolean;
  finalize: () => Promise<void>;
  isFinalized: boolean;
  error: Error | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Convert http(s) to ws(s) for WebSocket connection
const WS_URL = API_URL.replace(/^http/, 'ws');
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

export function useConversation(sessionId: string): UseConversationReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false); // Prevent duplicate connections

  // Refs to track state without causing dependency cycles in callbacks
  const isConnectedRef = useRef(false);
  const isFinalizedRef = useRef(false);
  const userRef = useRef(user);

  // Keep refs in sync with state
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    isFinalizedRef.current = isFinalized;
  }, [isFinalized]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
      MAX_RECONNECT_DELAY
    );
    return delay;
  }, []);

  // Process queued messages when reconnected
  // Uses ref to avoid dependency cycle: processMessageQueue -> isConnected -> connect -> effect
  const processMessageQueue = useCallback(async () => {
    if (!socketRef.current || !isConnectedRef.current || messageQueueRef.current.length === 0) {
      return;
    }

    const queue = [...messageQueueRef.current];
    messageQueueRef.current = [];

    for (const queuedMessage of queue) {
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Message send timeout'));
          }, 5000);

          socketRef.current?.emit('message', { content: queuedMessage.content }, (response: any) => {
            clearTimeout(timeout);
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve();
            }
          });
        });
      } catch (err) {
        console.error('Failed to send queued message:', err);
        // Re-queue on failure
        messageQueueRef.current.push(queuedMessage);
      }
    }
  }, []); // No dependencies - uses refs

  // Connect to WebSocket
  // Uses refs for state to prevent dependency cycle that causes reconnection loops
  const connect = useCallback(async () => {
    // Prevent duplicate connections (including during React Strict Mode double-mount)
    if (socketRef.current?.connected || isConnectingRef.current) {
      return;
    }

    const currentUser = userRef.current;
    if (!currentUser) {
      console.error('No user for WebSocket connection');
      return;
    }

    isConnectingRef.current = true;

    try {
      // Get fresh token for authentication
      const token = await currentUser.getIdToken();
      tokenRef.current = token;

      // Debug: Log token info (not the full token for security)
      console.log('Token type:', typeof token);
      console.log('Token length:', token ? token.length : 'null');
      console.log('Token preview:', token ? token.substring(0, 30) + '...' : 'null');

      console.log('Connecting to Socket.IO:', WS_URL, 'with sessionId:', sessionId);
      const socket = io(WS_URL, {
        transports: ['polling', 'websocket'], // Polling first, upgrade to websocket
        upgrade: true,
        reconnection: false, // Handle reconnection manually
        query: { sessionId },
        auth: { token },
        timeout: 20000, // 20 second timeout
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        isConnectingRef.current = false;
        setIsConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0;

        // Join conversation room
        socket.emit('join', { sessionId });

        // Process any queued messages
        processMessageQueue();
      });

      socket.on('connect_error', (err) => {
        console.error('Socket.IO connect_error:', err.message);
        setError(new Error(err.message));
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        isConnectingRef.current = false;
        setIsConnected(false);

        // Schedule reconnection with exponential backoff
        // Use ref to check finalized state to avoid dependency cycle
        if (!isFinalizedRef.current && reason !== 'io client disconnect') {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++;
            connect();
          }, delay);
        }
      });

      socket.on('joined', (data: { sessionId: string; session: any }) => {
        console.log('Joined session:', data.sessionId);
        // Load existing messages from session
        if (data.session?.messages && Array.isArray(data.session.messages)) {
          const existingMessages: Message[] = data.session.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(existingMessages);
        }
        // Check if session is already finalized
        if (data.session?.status === 'finalized') {
          setIsFinalized(true);
        }
      });

      socket.on('message', (message: Message) => {
        setMessages(prev => {
          // Check if this message already exists (optimistic or duplicate)
          // Optimistic messages have temp-* IDs, replace them with server message
          const existingIndex = prev.findIndex(m =>
            m.id === message.id ||
            (m.id.startsWith('temp-') && m.content === message.content && m.role === message.role)
          );

          if (existingIndex >= 0) {
            // Replace the optimistic/duplicate message with server message
            const updated = [...prev];
            updated[existingIndex] = {
              ...message,
              timestamp: new Date(message.timestamp)
            };
            return updated;
          }

          // New message, add it
          return [...prev, {
            ...message,
            timestamp: new Date(message.timestamp)
          }];
        });
      });

      socket.on('stream-start', () => {
        setIsStreaming(true);
      });

      socket.on('stream-chunk', (data: { content: string }) => {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];

          if (lastMessage && lastMessage.isStreaming) {
            // Create new array with new message object to avoid mutation
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + data.content }
            ];
          } else {
            return [...prev, {
              id: `stream-${Date.now()}`,
              role: 'ai',
              content: data.content,
              timestamp: new Date(),
              isStreaming: true
            }];
          }
        });
      });

      socket.on('stream-end', () => {
        setIsStreaming(false);
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.isStreaming) {
            // Create new array with new message object to avoid mutation
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, isStreaming: false }
            ];
          }
          return prev;
        });
      });

      socket.on('error', (err: any) => {
        console.error('WebSocket error:', err);
        setError(new Error(err.message || 'WebSocket error'));
      });

      socket.on('finalized', () => {
        setIsFinalized(true);
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err);
      isConnectingRef.current = false;
      setError(err instanceof Error ? err : new Error('Connection failed'));
    }
  }, [sessionId, getReconnectDelay, processMessageQueue]); // Removed user and isFinalized - use refs instead

  // Send message
  // Uses refs to avoid unnecessary re-renders when connection state changes
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      return;
    }

    if (isFinalizedRef.current) {
      throw new Error('Conversation is finalized');
    }

    // Add optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, optimisticMessage]);

    // If not connected, queue the message
    if (!isConnectedRef.current || !socketRef.current?.connected) {
      messageQueueRef.current.push({
        content,
        timestamp: Date.now()
      });
      return;
    }

    // Send via WebSocket
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message send timeout'));
        }, 5000);

        socketRef.current?.emit('message', { content }, (response: any) => {
          clearTimeout(timeout);
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        });
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Queue for retry
      messageQueueRef.current.push({
        content,
        timestamp: Date.now()
      });
      throw err;
    }
  }, []); // No dependencies - uses refs

  // Finalize conversation
  const finalize = useCallback(async () => {
    if (!socketRef.current?.connected) {
      throw new Error('Not connected');
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Finalize timeout'));
      }, 5000);

      socketRef.current?.emit('finalize', { sessionId }, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          setIsFinalized(true);
          resolve();
        }
      });
    });
  }, [sessionId]);

  // Track the sessionId we're currently connected to
  const connectedSessionIdRef = useRef<string>('');
  // Track the cleanup timeout (for cancellation on remount)
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effect 1: Handle connection logic
  useEffect(() => {
    // Cancel any pending cleanup from Strict Mode unmount
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (sessionId && user) {
      // If sessionId changed and we have an existing connection, disconnect first
      if (connectedSessionIdRef.current && connectedSessionIdRef.current !== sessionId) {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      }

      // Connect if not already connected
      if (!socketRef.current?.connected) {
        connectedSessionIdRef.current = sessionId;
        connect();
      }
    }
    // No cleanup here - we handle disconnection in the unmount effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user]);

  // Effect 2: Cleanup on unmount (deferred to handle Strict Mode)
  useEffect(() => {
    return () => {
      // Defer cleanup to next tick - if Strict Mode remounts, Effect 1 will cancel this
      cleanupTimeoutRef.current = setTimeout(() => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        connectedSessionIdRef.current = '';
        cleanupTimeoutRef.current = null;
      }, 0);
    };
  }, []); // Empty deps = runs on mount/unmount

  return {
    messages,
    sendMessage,
    isStreaming,
    isConnected,
    finalize,
    isFinalized,
    error
  };
}
