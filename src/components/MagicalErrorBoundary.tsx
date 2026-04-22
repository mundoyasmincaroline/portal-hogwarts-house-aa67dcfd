import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * MagicalErrorBoundary: A rede de segurança de Zion.
 * Impede a tela branca e oferece recuperação rápida.
 */
class MagicalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ZION_CRITICAL_ERROR:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono text-emerald-500">
          <div className="max-w-2xl w-full glass-dark p-12 rounded-[3rem] border border-red-500/30 text-center space-y-8 shadow-[0_0_100px_rgba(153,27,27,0.1)]">
            <ShieldAlert size={80} className="text-red-500 mx-auto animate-pulse" />
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-[0.3em] uppercase text-red-500">Falha de Renderização</h1>
              <p className="text-xs text-red-900 leading-relaxed max-w-md mx-auto italic">
                "Um feitiço de bloqueio foi detectado na estrutura. O Protocolo de Emergência Zion foi ativado para proteger os dados."
              </p>
            </div>
            
            <div className="bg-black/60 p-4 rounded-xl border border-red-900/20 text-left">
               <div className="flex items-center gap-2 text-[10px] text-red-900 mb-2 uppercase font-bold">
                  <Terminal size={12} /> Diagnóstico Técnico
               </div>
               <p className="text-[10px] text-red-500/70 font-mono break-all line-clamp-3">
                  {this.state.error?.message}
               </p>
            </div>

            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-500 text-white rounded-full px-10 h-14 gap-3 uppercase font-bold tracking-widest shadow-lg shadow-red-600/20"
            >
              <RefreshCw size={20} /> Reiniciar Realidade
            </Button>
          </div>
          <style>{`
            .glass-dark { background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(20px); }
          `}</style>
        </div>
      );
    }

    return this.children;
  }
}

export default MagicalErrorBoundary;
