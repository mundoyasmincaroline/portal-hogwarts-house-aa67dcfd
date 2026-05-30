import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * @deprecated Use pingPresence from useAuth instead.
 */
export function useUserStatus(userId: string | undefined) {
  useEffect(() => {
    // This hook is deprecated to avoid duplicate pings.
    // Auth-based presence is handled in DashboardLayout via useAuth().pingPresence.
  }, [userId]);
}
