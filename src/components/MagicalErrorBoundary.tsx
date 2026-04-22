import React, { Component, ErrorInfo, ReactNode } from "react";
import { supabase } from "../integrations/supabase/client";
import MagicalSyncOverlay from "./MagicalSyncOverlay";
import { Sparkles } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isSyncing: boolean;
}

/**
 * MagicalErrorBoundary: A rede de segurança suprema de Zion.
 * Reporta falhas diretamente para a 'Caixa Preta' (system_logs).
 */
export class MagicalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isSyncing: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isSyncing: false };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ZION_CRITICAL_ERROR:", error, errorInfo);
    
    try {
      // Reportar erro para a Caixa Preta de Zion
      await supabase.from("system_logs").insert({
        level: 'CRITICAL',
        message: error.message,
        stack: errorInfo.componentStack
      });
    } catch (e) {
      console.error("Falha ao reportar para Zion:", e);
    }
  }

  private handleDeepSync = () => {
    this.setState({ isSyncing: true });
    
    setTimeout(() => {
      // Protocolo de Limpeza Inteligente: Remove caches e versões, mas tenta preservar a entrada
      localStorage.removeItem("portal_version");
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (let name of names) caches.delete(name);
        });
      }
      
      // Se for erro de sessão, limpa tudo por segurança
      if (this.state.error?.message?.toLowerCase().includes('auth') || this.state.error?.message?.toLowerCase().includes('token')) {
        localStorage.clear();
      }
      
      window.location.href = "/";
    }, 3000);
  };

  public render() {
    if (this.state.isSyncing) {
      return <MagicalSyncOverlay message="Restauração de Zion em Curso" submessage="Tecendo novamente as fibras da realidade mágica..." />;
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
          {/* Fundo Cinematográfico de Zion */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_70%)]" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          </div>

          <div className="relative z-10 max-w-lg w-full glass rounded-[3rem] p-10 md:p-16 border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative w-24 h-24 mx-auto mb-8">
               <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
               <div className="relative w-full h-full glass rounded-3xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  <Sparkles className="text-primary animate-pulse" size={40} />
               </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading text-gold-gradient tracking-tight leading-tight">
                O Castelo está se <br/> <span className="italic">Reconfigurando</span>
              </h2>
              <p className="text-muted-foreground font-serif italic text-sm md:text-base leading-relaxed px-4">
                "Uma oscilação na magia foi detectada. Zion está restaurando os portões para garantir sua segurança no mundo bruxo."
              </p>
            </div>

            {/* Diagnóstico Secreto (Apenas para o Arquiteto) */}
            {window.location.hostname === 'localhost' && (
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-left opacity-30 hover:opacity-100 transition-opacity">
                <p className="text-[9px] font-mono text-primary/70 break-all leading-tight">
                  {this.state.error?.message || "Mystical Anomaly"}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <button 
                className="glass-plaque h-14 w-full text-xs font-heading font-bold uppercase tracking-[0.2em] text-primary"
                onClick={() => window.location.reload()}
              >
                Retornar ao Castelo
              </button>
              <button 
                className="text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-[0.3em] font-bold"
                onClick={this.handleDeepSync}
              >
                Restauração de Zion
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MagicalErrorBoundary;
