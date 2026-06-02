import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function PendingApproval() {
  const { logout, user, fetchProfile } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`approval-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload?.new?.approved) {
            fetchProfile(user.id);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchProfile]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.15)_0%,_transparent_70%)]" />
      {/* Faíscas mágicas de fundo */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/60 animate-sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: "0 0 10px hsl(var(--primary))",
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
      <div className="max-w-md w-full glass rounded-[2.5rem] p-8 sm:p-10 text-center space-y-7 z-10 border-primary/20 shadow-[0_30px_100px_rgba(0,0,0,0.8)] hover:border-primary/40 transition-all duration-700 relative">
        <div className="text-7xl animate-float drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]"><EmojiIcon e="🦉" /></div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Carta em trânsito</p>
          <h1 className="font-heading text-3xl text-gold-gradient tracking-tight leading-none">
            A coruja foi<br/>despachada
          </h1>
        </div>

        <p className="text-foreground/85 text-sm leading-relaxed italic">
          "Tudo o que precisamos decidir é o que fazer com o tempo
          que nos é dado."
          <br />
          <span className="not-italic text-xs text-muted-foreground">— Albus Dumbledore</span>
        </p>

        <div className="text-muted-foreground text-sm leading-relaxed">
          Sua ficha de matrícula viaja agora pelos corredores de Hogwarts.
          O Diretor analisa cada pergaminho com cuidado — para proteger todos os bruxos da nossa comunidade.
        </div>

        <div className="bg-secondary/30 rounded-xl p-4 border border-border/60 text-xs text-foreground/70 flex items-center gap-2 justify-center">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          Seu acesso será liberado assim que o pergaminho for selado.
        </div>

        <Button variant="outline" className="w-full" onClick={logout}>
          Aguardar fora do castelo
        </Button>
      </div>
    </div>
  );
}
