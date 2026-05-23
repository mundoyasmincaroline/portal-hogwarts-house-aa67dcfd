import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUserStatus(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const updateStatus = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString(), online: true })
          .eq('user_id', userId);
      } catch (error) {
        console.error("Error updating user status:", error);
      }
    };

    // Update immediately on mount
    updateStatus();

    // Set interval to update every 1 minute
    const interval = setInterval(updateStatus, 60000);

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      supabase
        .from('profiles')
        .update({ online: false })
        .eq('user_id', userId)
        .then(() => {});
    };
  }, [userId]);
}
