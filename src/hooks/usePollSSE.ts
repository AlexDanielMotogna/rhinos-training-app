import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to subscribe to poll updates via Server-Sent Events (SSE)
 * Provides real-time updates when votes are cast on attendance polls
 */

interface VoteUpdate {
  pollId: string;
  vote: {
    userId: string;
    userName: string;
    userPosition?: string;
    option: 'training' | 'present' | 'absent';
    timestamp: string;
  };
  action: 'created' | 'updated';
}

interface RSVPUpdate {
  sessionId: string;
  sessionCategory: 'team' | 'private';
  attendee: {
    userId: string;
    userName: string;
    status: 'going' | 'maybe' | 'not-going';
  };
  action: 'added' | 'updated';
  attendees: any[];
}

interface SessionCreatedUpdate {
  session: any;
  creatorId: string;
  creatorName: string;
}

interface SessionDeletedUpdate {
  sessionId: string;
  sessionCategory: 'team' | 'private';
}

interface UsePollSSEOptions {
  pollId?: string; // If specified, only listen to this poll
  onVoteUpdate?: (data: VoteUpdate) => void;
  onRSVPUpdate?: (data: RSVPUpdate) => void;
  onSessionCreated?: (data: SessionCreatedUpdate) => void;
  onSessionDeleted?: (data: SessionDeletedUpdate) => void;
  onConnected?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean; // Default true
}

export function usePollSSE(options: UsePollSSEOptions = {}) {
  const {
    pollId,
    onVoteUpdate,
    onRSVPUpdate,
    onSessionCreated,
    onSessionDeleted,
    onConnected,
    onError,
    enabled = true,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    // Don't connect if disabled or already connected
    if (!enabled || eventSourceRef.current) {
      return;
    }

    // Get auth token
    const token = localStorage.getItem('rhinos_auth_token');
    if (!token) {
      console.warn('[SSE] No auth token found, cannot connect');
      return;
    }

    // Build URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const url = pollId
      ? `${baseUrl}/api/sse/polls/${pollId}`
      : `${baseUrl}/api/sse/polls`;

    console.log(`[SSE] Connecting to ${url}`);

    // Create EventSource with auth header (using polyfill if needed)
    try {
      // Note: EventSource doesn't support custom headers natively
      // We'll use query params for auth instead
      const urlWithAuth = `${url}?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(urlWithAuth);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', () => {
        console.log('[SSE] Connected successfully');
        reconnectAttemptsRef.current = 0;
        onConnected?.();
      });

      eventSource.addEventListener('vote-update', (event) => {
        try {
          const data = JSON.parse(event.data) as VoteUpdate;
          console.log('[SSE] Received vote update:', data);
          onVoteUpdate?.(data);
        } catch (error) {
          console.error('[SSE] Error parsing vote update:', error);
        }
      });

      eventSource.addEventListener('rsvp-update', (event) => {
        try {
          const data = JSON.parse(event.data) as RSVPUpdate;
          console.log('[SSE] Received RSVP update:', data);
          onRSVPUpdate?.(data);
        } catch (error) {
          console.error('[SSE] Error parsing RSVP update:', error);
        }
      });

      eventSource.addEventListener('session-created', (event) => {
        try {
          const data = JSON.parse(event.data) as SessionCreatedUpdate;
          console.log('[SSE] Received session created:', data);
          onSessionCreated?.(data);
        } catch (error) {
          console.error('[SSE] Error parsing session created:', error);
        }
      });

      eventSource.addEventListener('session-deleted', (event) => {
        try {
          const data = JSON.parse(event.data) as SessionDeletedUpdate;
          console.log('[SSE] Received session deleted:', data);
          onSessionDeleted?.(data);
        } catch (error) {
          console.error('[SSE] Error parsing session deleted:', error);
        }
      });

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        onError?.(error);

        // Close and attempt reconnect with exponential backoff
        eventSource.close();
        eventSourceRef.current = null;

        if (enabled && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= 5) {
          console.error('[SSE] Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('[SSE] Error creating EventSource:', error);
    }
  }, [pollId, onVoteUpdate, onRSVPUpdate, onSessionCreated, onSessionDeleted, onConnected, onError, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      console.log('[SSE] Disconnecting');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: () => {
      disconnect();
      connect();
    },
  };
}
