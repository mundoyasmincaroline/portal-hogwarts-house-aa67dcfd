import { useState, useEffect } from "react";
import { useAuth, House } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { toast } from "sonner";
import { reward } from "@/services/core/rewardService";
import { Checkbox } from "@/components/ui/checkbox";

export default function RulesAgreement() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleAccept = async () => {
    if (!agreed) {
      toast.error("Você precisa concordar com as regras para entrar no castelo.");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ has_accepted_rules: true } as never)
      .eq("user_id", user?.id);

    if (error) {
      toast.error("Erro ao assinar o pergaminho. Tente novamente.");
      setLoading(false);
    } else {
      // Processar Referral pendente
      const pendingReferral = localStorage.getItem("pending_referral");
      if (pendingReferral && user) {
        try {
          // Busca o perfil do convidante
          const { data: inviter } = await supabase.from("profiles").select("user_id").eq("username", pendingReferral).maybeSingle();
          if (inviter) {
            await supabase.from("referrals").insert({ inviter_id: inviter.user_id, invited_id: user.id } as never);
            await supabase.rpc("award_xp_action", { _action: "referral_success", _user_id: inviter.user_id, _xp: 100 });
            await supabase.rpc("award_galeons", { _user_id: inviter.user_id, _amount: 50, _reason: "referral" });
            
            // Recompensa para o novo bruxo também
            await supabase.rpc("award_galeons", { _user_id: user.id, _amount: 10, _reason: "welcome" });
            await supabase.rpc("award_xp_action", { _action: "welcome_bonus", _user_id: user.id, _xp: 50 });

            localStorage.removeItem("pending_referral");
          }
        } catch (e) { console.error("Referral processing error:", e); }
      }

      // Recompensa de boas-vindas padrão (mesmo sem referral)
      if (!localStorage.getItem("pending_referral") && user) {
        await supabase.rpc("award_galeons", { _user_id: user.id, _amount: 10, _reason: "welcome" });
        await supabase.rpc("award_xp_action", { _action: "welcome_bonus", _user_id: user.id, _xp: 50 });
      }

      // Force reload auth state
      useAuth.setState((state) => ({
        profile: state.profile ? { ...state.profile, has_accepted_rules: true } : null
      }));
      toast.success("Regras aceitas! Você recebeu 10 Galeões e 50 XP de boas-vindas! ✨");

    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />
      <MagicalParticles />
      
      <div className="glass max-w-2xl w-full p-6 sm:p-8 rounded-[2.5rem] z-10 border-primary/20 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden animate-fade-in-up mx-2 hover:border-primary/40 transition-all duration-700">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">📜</span>
          <h1 className="font-heading text-3xl text-gold-gradient mb-2">Regras do Castelo</h1>
          <p className="text-muted-foreground text-sm">
            Para garantir a ordem e a segurança em nossa comunidade mágica, leia e aceite as regras abaixo.
          </p>
        </div>

        <div className="space-y-6 text-sm text-foreground/90 max-h-[40vh] overflow-y-auto pr-4 mb-8 custom-scrollbar border-y border-white/5 py-6">
          <div className="space-y-2">
            <h3 className="font-heading text-lg text-primary">1. Respeito Mútuo</h3>
            <p className="text-muted-foreground">Trate todos os alunos, professores e fantasmas com respeito. Não toleramos discurso de ódio, assédio ou qualquer forma de preconceito.</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-heading text-lg text-primary">2. Roleplay Responsável (Turnagem)</h3>
            <p className="text-muted-foreground">Separe o jogador (OFF) do personagem (ON). Ações do seu personagem são de sua responsabilidade narrativa.</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-heading text-lg text-primary">3. Conteúdo Apropriado</h3>
            <p className="text-muted-foreground">O envio de imagens ou textos com conteúdo adulto, extremo ou ilegal resultará em expulsão imediata de Hogwarts (Banimento).</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-heading text-lg text-primary">4. Anti-Burla de XP</h3>
            <p className="text-muted-foreground">O envio repetitivo de mensagens sem sentido apenas para "farmar" XP será detectado pelos monitores e resultará em perda de pontos para a sua casa e congelamento da conta.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg border border-border/30 mb-8">
          <Checkbox 
            id="terms" 
            checked={agreed} 
            onCheckedChange={(c) => setAgreed(c as boolean)} 
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm leading-snug cursor-pointer select-none">
            Eu juro solenemente não fazer nada de bom, e concordo em seguir todas as regras do Portal Hogwarts House para manter a magia viva.
          </label>
        </div>

        <Button 
          variant="magical" 
          className="w-full font-heading text-lg py-6"
          onClick={handleAccept}
          disabled={loading || !agreed}
        >
          {loading ? "Assinando com pena de sangue..." : "Assinar o Pergaminho"}
        </Button>
      </div>
    </div>
  );
}
