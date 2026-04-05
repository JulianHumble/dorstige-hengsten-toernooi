import { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import type { Session } from './types';

/**
 * Polls the session every few seconds as a fallback for when
 * Supabase Realtime misses an event. Calls onUpdate when
 * a change is detected.
 */
export function useSessionPolling(
  sessionId: string | null,
  onUpdate: (session: Session) => void,
  intervalMs = 3000
) {
  const lastRef = useRef<string>('');

  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (data) {
        // Only trigger if something actually changed
        const key = `${data.status}-${data.current_beer}`;
        if (lastRef.current && lastRef.current !== key) {
          onUpdate(data as Session);
        }
        lastRef.current = key;
      }
    };

    // Set initial value
    poll();

    const interval = setInterval(poll, intervalMs);
    return () => clearInterval(interval);
  }, [sessionId, onUpdate, intervalMs]);
}
