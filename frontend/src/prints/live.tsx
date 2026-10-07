import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../components/toast-context';
import { t } from '../i18n/nl';
import { keys } from './api';
import { LiveContext, type LiveStatus, type LiveValue } from './live-context';

/** Reconnect delays: 1 s, doubling, at most 30 s. */
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;
/** Close code the server uses when the session behind the socket ended. */
const SESSION_ENDED = 4401;
/** Live update flash length from the PrintCard spec ("1.6s flash"). */
const FLASH_MS = 1600;

/**
 * One WebSocket to /api/live for the signed-in app. Subscribes to every
 * customer the user may see; each event refetches the affected queries and
 * flashes the print. Reconnects with backoff; a lost connection is announced
 * once (LiveIndicator, Toast) and "Verbonden" when it is back.
 */
export function LiveProvider({
  children,
  onSessionEnded,
}: {
  children: ReactNode;
  onSessionEnded: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set());
  const sessionEnded = useRef(onSessionEnded);
  useEffect(() => {
    sessionEnded.current = onSessionEnded;
  }, [onSessionEnded]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let timer: number | undefined;
    let delay = MIN_DELAY_MS;
    let stopped = false;
    let wasLive = false;
    // ScreenSystemStates 1.9 (GAP-087): the offline bar is the state, so losing
    // the connection is not toasted; coming back still is.
    let lostConnection = false;
    const flashTimers: number[] = [];

    const connect = () => {
      const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      socket = new WebSocket(`${scheme}://${window.location.host}/api/live`);
      socket.onopen = () => {
        delay = MIN_DELAY_MS;
        socket?.send(JSON.stringify({ type: 'subscribe', customers: 'all' }));
      };
      socket.onmessage = (message: MessageEvent<string>) => {
        const data = JSON.parse(message.data) as { type: string; printId?: string };
        if (data.type === 'subscribed') {
          setStatus('live');
          if (lostConnection) {
            lostConnection = false;
            toast.success(t('system.reconnected'));
          }
          // Anything may have changed while we were away.
          if (wasLive) void queryClient.invalidateQueries({ queryKey: keys.all });
          wasLive = true;
          return;
        }
        if (data.printId === undefined) return;
        void queryClient.invalidateQueries({ queryKey: keys.all });
        const id = data.printId;
        setFlashing((current) => new Set([...current, id]));
        // The flash also ends without an animation (reduced motion, print not on screen).
        flashTimers.push(
          window.setTimeout(() => {
            setFlashing((current) => without(current, id));
          }, FLASH_MS),
        );
      };
      socket.onclose = (event) => {
        socket = null;
        if (stopped) return;
        if (event.code === SESSION_ENDED) {
          sessionEnded.current();
          return;
        }
        setStatus('reconnecting');
        if (wasLive) lostConnection = true;
        timer = window.setTimeout(connect, delay);
        delay = Math.min(delay * 2, MAX_DELAY_MS);
      };
    };
    connect();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      for (const flashTimer of flashTimers) window.clearTimeout(flashTimer);
      socket?.close();
    };
  }, [queryClient, toast]);

  const value: LiveValue = {
    status,
    flashing,
    doneFlashing: (printId) => {
      setFlashing((current) => without(current, printId));
    },
  };
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

function without(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  if (!set.has(id)) return set;
  const next = new Set(set);
  next.delete(id);
  return next;
}
