// Hogwarts Portal - Sync Test
import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="font-heading text-2xl text-primary mb-2">O feitiço falhou por um instante.</h1>
          <p className="text-muted-foreground mb-5">Recarregue a página para tentar entrar novamente no portal.</p>
          <button className="rounded-xl bg-primary px-5 py-2 font-heading text-primary-foreground" onClick={() => window.location.reload()}>
            Recarregar portal
          </button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
