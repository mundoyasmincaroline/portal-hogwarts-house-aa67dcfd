// Hogwarts Portal - Sync Test
import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Magical Error Detected:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100vh", width: "100vw", background: "#050505", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          flexDirection: "column", color: "#f59e0b", fontFamily: "serif",
          textAlign: "center", padding: "2rem", position: "relative", overflow: "hidden"
        }}>
          {/* Background Matrix/Magic Effect */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.1, pointerEvents: "none" }}>
            <div className="matrix-rain" style={{ fontSize: '10px' }}>⚡ 🪄 🔮 🧙 ⚡</div>
          </div>
          
          <div style={{ position: "relative", zIndex: 10 }}>
            <div style={{ fontSize: "5rem", marginBottom: "1rem", animation: "float 3s ease-in-out infinite" }}>🔮</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "0.5rem" }}>
              Perturbação na Trama Mágica
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 2rem" }}>
              Parece que Edwiges encontrou uma tempestade no caminho. O castelo está passando por uma manutenção mágica instantânea.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: "transparent", border: "1px solid #f59e0b", color: "#f59e0b",
                padding: "0.75rem 2rem", borderRadius: "2rem", fontSize: "0.8rem", 
                cursor: "pointer", textTransform: "uppercase", fontWeight: "bold",
                boxShadow: "0 0 15px rgba(245,158,11,0.2)"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.1)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              Restaurar Magia 🪄
            </button>
          </div>
          
          {/* Secret tag for admins */}
          <div style={{ position: "fixed", bottom: 10, right: 10, fontSize: "8px", opacity: 0.3, color: "#444" }}>
            ERR_MAGICAL_INTERFERENCE
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
