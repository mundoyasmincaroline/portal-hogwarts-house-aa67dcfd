import React, { Component, ErrorInfo, ReactNode } from "react";
import { Sparkles, ShieldAlert, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Aqui poderíamos enviar para um serviço de logs no futuro
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
          {/* Background Magic Effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
          </div>

          <div className="relative z-10 max-w-lg w-full glass rounded-[3rem] p-10 md:p-16 border-2 border-white/10 shadow-[0_0_100px_rgba(var(--primary),0.1)] text-center space-y-8 animate-fade-in">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
              <ShieldAlert className="text-primary animate-pulse" size={48} />
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading text-white tracking-tight leading-tight">
                Instabilidade na <span className="text-primary italic">Trama Mágica</span>
              </h2>
              <p className="text-muted-foreground font-serif italic text-sm md:text-base leading-relaxed">
                "Parece que um feitiço saiu pela culatra. Não se preocupe, os Arquitetos já foram notificados por nossas corujas e a magia está sendo restaurada."
              </p>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Código de Erro</p>
               <p className="text-[11px] font-mono text-primary/70 break-all leading-tight">
                 {this.state.error?.message || "Erro Místico Desconhecido"}
               </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                variant="magical" 
                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={14} className="mr-2" /> Restaurar Magia
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white"
                onClick={() => window.location.href = "/"}
              >
                <Home size={14} className="mr-2" /> Voltar ao Início
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground pt-4">
              <Sparkles size={10} className="inline mr-1" /> Protocolo Jarvis de Recuperação Ativo
            </p>
          </div>
        </div>
      );
    }

    return this.children;
  }
}

export default ErrorBoundary;
