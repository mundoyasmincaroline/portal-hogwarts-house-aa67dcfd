import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function PendingApproval() {
  const { logout, user, fetchProfile } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`approval-${user.id}`)
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
      <div className="max-w-md w-full glass rounded-[2.5rem] p-8 sm:p-10 text-center space-y-8 z-10 border-primary/20 shadow-[0_30px_100px_rgba(0,0,0,0.8)] hover:border-primary/40 transition-all duration-700">
        <div className="text-7xl animate-float drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">⏳</div>
        <h1 className="font-heading text-3xl text-gold-gradient tracking-tight leading-none">Aguardando<br/>Aprovação</h1>
        
        <p className="text-muted-foreground text-sm">
          Sua coruja já entregou sua ficha aos diretores de Hogwarts.
          <br /><br />
          Estamos avaliando seus dados para garantir a segurança de todos os bruxos da nossa comunidade. Isso pode levar algumas horas.
        </p>

        <div className="bg-secondary/30 rounded-xl p-4 border border-border text-xs text-muted-foreground">
          Por favor, aguarde. O seu acesso será liberado automaticamente assim que for aprovado.
        </div>

        <Button variant="outline" className="w-full" onClick={logout}>
          Sair do Portal
        </Button>
      </div>
    </div>
  );
}
