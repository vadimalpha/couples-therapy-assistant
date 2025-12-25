import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

const WS_URL = 'ws://localhost:3001';
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

export function useConversation(sessionId: string): UseConversationReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
      MAX_RECONNECT_DELAY
    );
    return delay;
  }, []);

  // Process queued messages when reconnected
  const processMessageQueue = useCallback(async () => {
    if (!socketRef.current || !isConnected || messageQueueRef.current.length === 0) {
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
  }, [isConnected]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: false, // Handle reconnection manually
        query: { sessionId }
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0;

        // Join conversation room
        socket.emit('join', { sessionId });

        // Process any queued messages
        processMessageQueue();
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);

        // Schedule reconnection with exponential backoff
        if (!isFinalized && reason !== 'io client disconnect') {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++;
            connect();
          }, delay);
        }
      });

      socket.on('message', (message: Message) => {
        setMessages(prev => [...prev, {
          ...message,
          timestamp: new Date(message.timestamp)
        }]);
      });

      socket.on('stream-start', () => {
        setIsStreaming(true);
      });

      socket.on('stream-chunk', (data: { content: string }) => {
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];

          if (lastMessage && lastMessage.isStreaming) {
            lastMessage.content += data.content;
          } else {
            updated.push({
              id: `stream-${Date.now()}`,
              role: 'ai',
              content: data.content,
              timestamp: new Date(),
              isStreaming: true
            });
          }

          return updated;
        });
      });

      socket.on('stream-end', () => {
        setIsStreaming(false);
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
          }
          return updated;
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
      setError(err instanceof Error ? err : new Error('Connection failed'));
    }
  }, [sessionId, isFinalized, getReconnectDelay, processMessageQueue]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      return;
    }

    if (isFinalized) {
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
    if (!isConnected || !socketRef.current?.connected) {
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
  }, [isConnected, isFinalized]);

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

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

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
