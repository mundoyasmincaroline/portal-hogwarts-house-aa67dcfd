import { supabase } from "@/integrations/supabase/client";

export const COOLDOWN_SECONDS = 30;
export const MAX_XP_PER_MINUTE = 200;

export async function addXP(userId: string, amount: number, actionType: 'message' | 'enigma' | 'rpg'): Promise<{ success: boolean; message?: string }> {
  try {
    // A lógica de cooldown e limites agora é tratada inteiramente pela RPC no banco de dados
    const { error: rpcError } = await supabase.rpc('award_xp_action', {
      _action: actionType,
      _user_id: userId,
      _xp: amount
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return { success: false, message: "Erro ao sincronizar XP." };
    }

    return { success: true };
  } catch (err) {
    console.error("Error adding XP:", err);
    return { success: false, message: "Erro ao processar XP." };
  }
}
