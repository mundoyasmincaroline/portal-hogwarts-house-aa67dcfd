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
          {/* ── CINEMATIC BACKGROUND (MONSTER QUALITY) ── */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000" 
              className="w-full h-full object-cover opacity-20 grayscale scale-110 blur-sm" 
              alt="Magic Background" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-primary/10" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          </div>

          <div className="relative z-10 max-w-lg w-full glass rounded-[3.5rem] p-1 md:p-1 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in duration-1000 overflow-hidden">
            <div className="relative bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[3.4rem] p-12 md:p-16 border border-white/5 space-y-10 text-center">
              
              {/* Icon Artifact */}
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full animate-pulse" />
                <div className="relative w-full h-full glass-dark rounded-[2rem] flex items-center justify-center border border-primary/40 shadow-[0_0_30px_rgba(212,175,55,0.3)] group">
                  <div className="relative">
                    <Sparkles className="text-primary animate-pulse-glow" size={48} />
                    <span className="absolute -top-1 -right-1 text-primary font-bold text-xl">+</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-heading text-gold-gradient tracking-tighter leading-none uppercase italic">
                  O Castelo está se <br/> <span className="text-white/90">Reconfigurando</span>
                </h2>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto" />
                <p className="text-muted-foreground font-serif italic text-base md:text-lg leading-relaxed px-4 opacity-80">
                  "Uma oscilação na magia foi detectada. Zion está restaurando os portões para garantir sua segurança no mundo bruxo."
                </p>
              </div>

              <div className="flex flex-col gap-6 pt-4">
                <button 
                  className="glass-plaque h-20 w-full text-sm font-heading font-bold uppercase tracking-[0.3em] text-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.5)] border-primary/20"
                  onClick={() => window.location.href = "/"}
                >
                  Retornar ao Castelo
                </button>
                
                <div className="flex flex-col items-center gap-3">
                  <button 
                    className="text-[10px] text-white/20 hover:text-primary/60 transition-all uppercase tracking-[0.4em] font-bold"
                    onClick={this.handleDeepSync}
                  >
                    Restauração de Zion
                  </button>
                  <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/20" />)}
                  </div>
                </div>
              </div>

              {/* Debug Artifact (Secret) */}
              {window.location.hostname === 'localhost' && (
                <div className="mt-8 p-4 bg-black/60 rounded-2xl border border-white/5 text-left opacity-20 hover:opacity-100 transition-opacity overflow-hidden">
                  <p className="text-[8px] font-mono text-primary/50 break-all leading-tight italic">
                    Log: {this.state.error?.message || "Mystical Anomaly detected in the weave."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MagicalErrorBoundary;
