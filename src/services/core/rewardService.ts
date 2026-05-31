
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { audioEngine, AudioPreset } from "./audioEngine";
import { hapticService } from "./hapticService";

export type RewardAction =
  | 'daily_login' | 'post' | 'comment' | 'reaction' | 'story'
  | 'message' | 'insta_post' | 'insta_like' | 'follow'
  | 'challenge' | 'class' | 'duel_win' | 'duel_loss'
  | 'first_character' | 'profile_update'
  | 'sticker_buy' | 'sticker_trade' | 'referral'
  | 'level_up' | 'badge_earn'
  | 'welcome_bonus';

interface RewardConfig {
  xp: number;
  galeons: number;
  sfx?: AudioPreset;
  message?: string;
}

export const REWARDS: Record<RewardAction, RewardConfig> = {
  daily_login: { xp: 25, galeons: 5, sfx: 'magic', message: "Bom dia! +25 XP e +5🪙 Galeões pela sua presença!" },
  post: { xp: 10, galeons: 2, sfx: 'quill', message: "Postagem mágica! +10 XP e +2🪙 Galeões." },
  comment: { xp: 5, galeons: 1, sfx: 'quill', message: "Interação valiosa! +5 XP e +1🪙 Galeão." },
  reaction: { xp: 1, galeons: 0, sfx: 'tap' },
  story: { xp: 8, galeons: 1, sfx: 'quill', message: "Memória guardada! +8 XP e +1🪙 Galeão." },
  message: { xp: 2, galeons: 0, sfx: 'quill' },
  insta_post: { xp: 10, galeons: 2, sfx: 'quill', message: "InstaHogwarts atualizado! +10 XP e +2🪙 Galeões." },
  insta_like: { xp: 1, galeons: 0, sfx: 'tap' },
  follow: { xp: 5, galeons: 0, sfx: 'magic' },
  challenge: { xp: 50, galeons: 10, sfx: 'levelUp', message: "Desafio concluído! +50 XP e +10🪙 Galeões!" },
  class: { xp: 30, galeons: 5, sfx: 'bookFlip', message: "Aula assistida! +30 XP e +5🪙 Galeões." },
  duel_win: { xp: 50, galeons: 15, sfx: 'wandSwish', message: "Vitória no duelo! +50 XP e +15🪙 Galeões!" },
  duel_loss: { xp: 10, galeons: 0, sfx: 'error', message: "Derrota no duelo. +10 XP pelo esforço." },
  first_character: { xp: 20, galeons: 5, sfx: 'magic', message: "Matrícula aceita! +20 XP e +5🪙 Galeões." },
  profile_update: { xp: 2, galeons: 0, sfx: 'magic' },
  sticker_buy: { xp: 5, galeons: -10, sfx: 'coin' }, // XP pela compra, custo tratado no componente
  sticker_trade: { xp: 10, galeons: 0, sfx: 'magic', message: "Troca realizada! +10 XP." },
  referral: { xp: 100, galeons: 50, sfx: 'owlHoot', message: "Novo bruxo recrutado! +100 XP e +50🪙 Galeões!" },
  level_up: { xp: 0, galeons: 15, sfx: 'levelUp', message: "Parabéns! Subiu de nível! +15🪙 Galeões de bônus." },
  badge_earn: { xp: 0, galeons: 25, sfx: 'magic', message: "Nova medalha conquistada! +25🪙 Galeões de bônus." },
  welcome_bonus: { xp: 50, galeons: 10, sfx: 'magic', message: "Bem-vindo ao castelo! Bônus de matrícula creditado." }
};

export async function reward(userId: string, action: RewardAction, customXP?: number) {
  const config = REWARDS[action];
  if (!config) return;

  try {
    // 1. Award XP via RPC
    const xpToAward = customXP ?? config.xp;
    if (xpToAward !== 0) {
      await supabase.rpc('award_xp_action', {
        _action: action,
        _user_id: userId,
        _xp: xpToAward
      });
    }

    // 2. Award Galeons via RPC
    if (config.galeons !== 0) {
      await supabase.rpc('award_galeons', {
        _user_id: userId,
        _amount: config.galeons,
        _reason: action
      });
    }

    // 3. Sensorial feedback
    if (config.sfx) audioEngine.play(config.sfx);
    if (config.xp > 0 || config.galeons > 0) hapticService.success();
    else if (config.xp < 0 || config.galeons < 0) hapticService.tap();

    // 4. Toast
    if (config.message) {
      toast.success(config.message, {
        icon: config.galeons > 0 ? "🪙" : "✨",
        duration: 3500
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Reward system failure:", err);
    return { success: false };
  }
}
