import { supabase } from "@/integrations/supabase/client";

export const COOLDOWN_SECONDS = 30;
export const MAX_XP_PER_MINUTE = 200;

export async function addXP(userId: string, amount: number, actionType: 'message' | 'enigma' | 'rpg'): Promise<{ success: boolean; message?: string }> {
  try {
    // Check cooldowns
    const { data: cooldownData, error: cooldownError } = await supabase
      .from('user_cooldowns')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const now = new Date();
    
    if (cooldownData) {
      // Check specific cooldowns based on action type
      if (actionType === 'message' && cooldownData.last_message_at) {
        const lastMsg = new Date(cooldownData.last_message_at);
        const diffSeconds = (now.getTime() - lastMsg.getTime()) / 1000;
        
        if (diffSeconds < COOLDOWN_SECONDS) {
          return { success: false, message: `Aguarde ${Math.ceil(COOLDOWN_SECONDS - diffSeconds)}s para ganhar XP novamente.` };
        }
      }

      // Check max XP per minute
      const minuteStart = new Date(cooldownData.minute_started_at);
      const diffMinutes = (now.getTime() - minuteStart.getTime()) / 60000;

      if (diffMinutes < 1 && cooldownData.xp_gained_this_minute + amount > MAX_XP_PER_MINUTE) {
        return { success: false, message: "Limite de XP por minuto atingido. Respire um pouco!" };
      }
    }

    // Update profile XP via backend RPC
    const { error: rpcError } = await supabase.rpc('award_xp_action', {
      _action: actionType,
      _user_id: userId,
      _xp: amount
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return { success: false, message: "Erro ao sincronizar XP." };
    }

    // Update cooldowns
    let newCooldownData: any = {
      user_id: userId,
    };

    if (actionType === 'message') newCooldownData.last_message_at = now.toISOString();
    if (actionType === 'enigma') newCooldownData.last_enigma_at = now.toISOString();

    if (cooldownData) {
      const minuteStart = new Date(cooldownData.minute_started_at);
      const diffMinutes = (now.getTime() - minuteStart.getTime()) / 60000;
      
      if (diffMinutes >= 1) {
        newCooldownData.minute_started_at = now.toISOString();
        newCooldownData.xp_gained_this_minute = amount;
      } else {
        newCooldownData.xp_gained_this_minute = cooldownData.xp_gained_this_minute + amount;
      }
      
      await supabase.from('user_cooldowns').update(newCooldownData).eq('user_id', userId);
    } else {
      newCooldownData.minute_started_at = now.toISOString();
      newCooldownData.xp_gained_this_minute = amount;
      await supabase.from('user_cooldowns').insert([newCooldownData]);
    }

    return { success: true };
  } catch (err) {
    console.error("Error adding XP:", err);
    return { success: false, message: "Erro ao processar XP." };
  }
}
