import React, { Component, ErrorInfo, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * MagicalErrorBoundary: A rede de segurança suprema de Zion.
 * Reporta falhas diretamente para a 'Caixa Preta' (system_logs).
 */
export class MagicalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
          {/* Background Magic Effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#d4af371a] rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
          </div>

          <div className="relative z-10 max-w-lg w-full bg-[#121212a6] backdrop-blur-3xl rounded-[3rem] p-10 md:p-16 border-2 border-white/10 shadow-[0_0_100px_rgba(212,175,55,0.1)] text-center space-y-8">
            <div className="w-24 h-24 bg-[#d4af371a] rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
              <div className="text-[#d4af37] text-5xl animate-pulse">⚠️</div>
              <div className="absolute inset-0 bg-[#d4af3733] blur-2xl rounded-full -z-10" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight font-serif">
                Instabilidade na <span className="text-[#d4af37] italic">Trama Mágica</span>
              </h2>
              <p className="text-[#94a3b8] font-serif italic text-sm md:text-base leading-relaxed">
                "Parece que um feitiço saiu pela culatra. Não se preocupe, Zion está recalibrando a realidade e a magia será restaurada em instantes."
              </p>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
               <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-bold mb-1">Diagnóstico de Zion</p>
               <p className="text-[11px] font-mono text-[#d4af37]/70 break-all leading-tight">
                 {this.state.error?.message || "Erro Místico Desconhecido"}
               </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#d4af37] text-black hover:bg-[#b8962d] transition-all shadow-lg shadow-[#d4af3733]"
                onClick={() => window.location.reload()}
              >
                Restaurar Portal
              </button>
            </div>

            <p className="text-[10px] text-[#94a3b8] pt-4">
              ✨ Protocolo Jarvis de Recuperação Ativo
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MagicalErrorBoundary;
