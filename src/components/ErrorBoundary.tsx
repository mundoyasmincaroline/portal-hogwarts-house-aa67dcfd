import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 glass rounded-[2.5rem] border-2 border-red-500/30 bg-gradient-to-br from-red-950/40 via-black to-black text-center space-y-6 m-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.1),_transparent_70%)]" />
          <div className="text-6xl animate-pulse filter drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">🔮</div>
          <div className="relative z-10 space-y-2">
            <h2 className="font-heading text-3xl text-red-500 uppercase tracking-tighter">Perturbação na Trama Mágica</h2>
            <p className="text-muted-foreground text-sm font-serif italic max-w-md mx-auto leading-relaxed">
              "Parece que um feitiço de confusão atingiu esta parte do castelo. Os elfos domésticos já foram notificados para restaurar a ordem."
            </p>
            {this.state.error && (
              <p className="text-[10px] text-red-500/50 font-mono mt-4 truncate max-w-xs mx-auto">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-8 py-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-full text-xs font-heading font-bold uppercase tracking-widest text-red-400 transition-all hover:scale-105 active:scale-95"
          >
            Conjurar Restauração ⚡
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
