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
    const channelId = `rt:${table}:${event}:${filter || 'all'}`;
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
