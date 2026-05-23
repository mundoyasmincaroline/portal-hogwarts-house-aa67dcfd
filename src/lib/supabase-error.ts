import { toast } from "sonner";

/**
 * Traduz códigos de erro do Supabase para mensagens amigáveis em português.
 */
export function translateError(code: string | undefined): string {
  switch (code) {
    case "23505":
      return "Este registro já existe no castelo.";
    case "42501":
      return "Você não tem permissão para realizar esta magia.";
    case "23503":
      return "Não foi possível completar a ação devido a uma dependência inexistente.";
    case "PGRST116":
      return "Nenhum resultado encontrado.";
    default:
      return "Ocorreu um erro inesperado no portal.";
  }
}

/**
 * Helper centralizado para tratamento de erros do Supabase.
 * Loga no console para depuração e exibe toast amigável para o usuário.
 */
export function handleSupabaseError(error: any, context: string) {
  if (!error) return;
  
  console.error(`[${context}]`, error);
  
  const message = error.message || translateError(error.code);
  
  toast.error(`${context}: ${message}`, {
    description: "Tente novamente ou contate um monitor.",
    duration: 4000,
  });
}
