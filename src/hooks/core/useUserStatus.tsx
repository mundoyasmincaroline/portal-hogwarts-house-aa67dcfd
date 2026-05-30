import { useEffect } from 'react';

/**
 * @deprecated Use pingPresence from useAuth instead.
 */
export function useUserStatus(userId: string | undefined) {
  useEffect(() => {
    // Deprecated to avoid duplicate pings.
  }, [userId]);
}