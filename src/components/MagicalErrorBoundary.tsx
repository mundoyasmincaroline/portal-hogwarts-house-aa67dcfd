import React from "react";
import { Sparkles, RefreshCw, LogOut, ChevronLeft } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MagicalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ZION_SECURITY_ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          {/* Background Layers */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000" 
              className="w-full h-full object-cover opacity-20 grayscale scale-110" 
              alt="Magic background" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          </div>

          <div className="relative z-10 max-w-2xl w-full px-6 animate-in fade-in zoom-in duration-1000">
            <div className="glass rounded-[3.5rem] p-1 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden">
              <div className="relative bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[3.4rem] p-12 md:p-16 border border-white/5 space-y-10 text-center overflow-hidden">
                {/* Internal Light Effects */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] animate-pulse delay-700" />
                
                <div className="space-y-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.2)] animate-float">
                    <Sparkles className="text-primary" size={48} />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-heading text-gold-gradient tracking-tighter">O Castelo está se <br /> Reconfigurando</h1>
                    <p className="text-muted-foreground font-serif italic text-sm md:text-base">"Uma oscilação na trama mágica foi detectada. O Arquiteto já está ciente."</p>
                  </div>
                </div>

                <div className="p-8 glass bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary/60 font-bold mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    Relatório de Anomalia
                  </div>
                  <p className="text-xs text-white/40 font-mono break-all line-clamp-3">
                    {this.state.error?.toString()}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => window.location.href = "/"}
                    className="flex-1 h-16 rounded-2xl text-base shadow-[0_15px_40px_rgba(0,0,0,0.5)] active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 font-heading uppercase tracking-widest transition-all"
                  >
                    RETORNAR AOS PORTÕES
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex-1 h-16 rounded-2xl border border-white/10 hover:bg-white/5 text-xs uppercase tracking-widest font-bold text-white transition-all"
                  >
                    TENTAR RECONEXÃO ⚡
                  </button>
                </div>

                <p className="text-[9px] text-white/20 uppercase tracking-[0.5em] font-bold">Protocolo Zion Security v9.0</p>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0) rotate(0); }
              50% { transform: translateY(-15px) rotate(2deg); }
            }
            .animate-float { animation: float 6s ease-in-out infinite; }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MagicalErrorBoundary;
