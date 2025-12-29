import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SharedMessage {
  id: string;
  role: 'partner-a' | 'partner-b' | 'ai';
  content: string;
  timestamp: Date;
  senderName?: string;
  isStreaming?: boolean;
}

export interface ParticipantStatus {
  id: string;
  name: string;
  role: 'partner-a' | 'partner-b';
  isOnline: boolean;
  isTyping: boolean;
}

interface QueuedMessage {
  content: string;
  timestamp: number;
}

interface UseSharedConversationReturn {
  messages: SharedMessage[];
  participants: ParticipantStatus[];
  sendMessage: (content: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  isStreaming: boolean;
  isConnected: boolean;
  finalize: () => Promise<void>;
  isFinalized: boolean;
  error: Error | null;
  currentUserRole: 'partner-a' | 'partner-b' | null;
}

const WS_URL = 'ws://localhost:3001';
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

export function useSharedConversation(
  relationshipId: string,
  userId: string
): UseSharedConversationReturn {
  const [messages, setMessages] = useState<SharedMessage[]>([]);
  const [participants, setParticipants] = useState<ParticipantStatus[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'partner-a' | 'partner-b' | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
      MAX_RECONNECT_DELAY
    );
    return delay;
  }, []);

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

          socketRef.current?.emit('shared-message', { content: queuedMessage.content }, (response: any) => {
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
        messageQueueRef.current.push(queuedMessage);
      }
    }
  }, [isConnected]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: false,
        query: { relationshipId, userId }
      });

      socket.on('connect', () => {
        console.log('WebSocket connected to shared room');
        setIsConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0;

        socket.emit('join-shared', { relationshipId, userId });

        processMessageQueue();
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);

        if (!isFinalized && reason !== 'io client disconnect') {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++;
            connect();
          }, delay);
        }
      });

      socket.on('user-role', (data: { role: 'partner-a' | 'partner-b' }) => {
        setCurrentUserRole(data.role);
      });

      socket.on('participants-update', (participantsData: ParticipantStatus[]) => {
        setParticipants(participantsData.map(p => ({
          ...p,
          isOnline: true
        })));
      });

      socket.on('participant-online', (data: { userId: string; role: 'partner-a' | 'partner-b' }) => {
        setParticipants(prev => prev.map(p =>
          p.id === data.userId ? { ...p, isOnline: true } : p
        ));
      });

      socket.on('participant-offline', (data: { userId: string }) => {
        setParticipants(prev => prev.map(p =>
          p.id === data.userId ? { ...p, isOnline: false } : p
        ));
      });

      socket.on('participant-typing', (data: { userId: string; isTyping: boolean }) => {
        setParticipants(prev => prev.map(p =>
          p.id === data.userId ? { ...p, isTyping: data.isTyping } : p
        ));
      });

      socket.on('shared-message', (message: SharedMessage) => {
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
      setError(err instanceof Error ? err : new Error('Connection failed'));
    }
  }, [relationshipId, userId, isFinalized, getReconnectDelay, processMessageQueue]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      return;
    }

    if (isFinalized) {
      throw new Error('Conversation is finalized');
    }

    if (!currentUserRole) {
      throw new Error('User role not assigned');
    }

    const optimisticMessage: SharedMessage = {
      id: `temp-${Date.now()}`,
      role: currentUserRole,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, optimisticMessage]);

    if (!isConnected || !socketRef.current?.connected) {
      messageQueueRef.current.push({
        content,
        timestamp: Date.now()
      });
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message send timeout'));
        }, 5000);

        socketRef.current?.emit('shared-message', { content }, (response: any) => {
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
      messageQueueRef.current.push({
        content,
        timestamp: Date.now()
      });
      throw err;
    }
  }, [isConnected, isFinalized, currentUserRole]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { isTyping });
    }
  }, []);

  const finalize = useCallback(async () => {
    if (!socketRef.current?.connected) {
      throw new Error('Not connected');
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Finalize timeout'));
      }, 5000);

      socketRef.current?.emit('finalize-shared', { relationshipId }, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          setIsFinalized(true);
          resolve();
        }
      });
    });
  }, [relationshipId]);

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
    participants,
    sendMessage,
    setTyping,
    isStreaming,
    isConnected,
    finalize,
    isFinalized,
    error,
    currentUserRole
  };
}
