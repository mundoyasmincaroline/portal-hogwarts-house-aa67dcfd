import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface SeasonalEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type: string;
  house_points_bonus: number;
  xp_multiplier: number;
  active: boolean;
}

export function useSeasonalEvents() {
  const [activeEvents, setActiveEvents] = useState<SeasonalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .eq('active', true)
        .lte('start_date', today)
        .gte('end_date', today);

      if (!error && data) {
        setActiveEvents(data as SeasonalEvent[]);
      }
      setLoading(false);
    }

    fetchEvents();
  }, []);

  return { activeEvents, loading };
}
