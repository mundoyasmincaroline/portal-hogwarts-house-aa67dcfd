import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useRealtime — Hook centralizado para lidar com assinaturas realtime de forma eficiente.
 * Gerencia o ciclo de vida e evita múltiplas conexões desnecessárias.
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
    const channelName = `realtime-${table}-${event}-${filter || 'all'}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter]);
}
