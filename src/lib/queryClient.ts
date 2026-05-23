import { QueryClient } from "@tanstack/react-query";
import { handleSupabaseError } from "./supabase-error";

/**
 * Instância global do QueryClient configurada para performance e estabilidade.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos
      retry: (failureCount, error: any) => {
        // Retry apenas para erros de rede ou servidor (500+)
        if (error?.status >= 500 && failureCount < 2) return true;
        return false;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      onError: (error, _variables, _context) => {
        handleSupabaseError(error, "Ação falhou");
      },
    },
  },
});
