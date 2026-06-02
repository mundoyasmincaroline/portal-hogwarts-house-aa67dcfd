import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useRealtime — Hook centralizado para lidar com assinaturas realtime de forma eficiente.
 * Estabiliza o channelId para evitar reconexões desnecessárias e loga falhas.
 */
export function useRealtime<T>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: any) => void,
  filter?: string
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    // Unique channelId per hook instance — prevents the supabase-js
    // "cannot add postgres_changes callbacks after subscribe()" error that
    // happens when StrictMode/HMR re-mounts and the same topic instance is
    // still referenced by the realtime client.
    const channelId = `rt:${table}:${event}:${filter || 'all'}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          callbackRef.current(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[realtime] ${table} status: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter]);
}
