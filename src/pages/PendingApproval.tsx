import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function PendingApproval() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full glass rounded-2xl p-6 sm:p-8 text-center space-y-6">
        <div className="text-6xl animate-pulse">⏳</div>
        <h1 className="font-heading text-2xl text-gold-gradient">Aguardando Aprovação</h1>
        
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
