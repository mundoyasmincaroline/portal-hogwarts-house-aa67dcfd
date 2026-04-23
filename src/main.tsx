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
          height: "100vh", width: "100vw", background: "#000", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          flexDirection: "column", color: "#f59e0b", fontFamily: "serif",
          textAlign: "center", position: "relative", overflow: "hidden"
        }}>
          {/* Background Image - Hogwarts Loading Style */}
          <img 
            src="/monster_quality_hogwarts_maintenance_loading_1776870699373.png" 
            style={{ 
              position: "absolute", inset: 0, width: "100%", height: "100%", 
              objectFit: "cover", opacity: 0.6, filter: "brightness(0.5) blur(2px)" 
            }} 
            alt="Hogwarts"
          />
          
          {/* Content Overlay */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="animate-pulse" style={{ fontSize: "4rem", marginBottom: "2rem" }}>🔮</div>
            
            <h1 style={{ fontSize: "1.2rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "1rem", color: "#fff" }}>
              Restaurando a Trama Mágica...
            </h1>
            
            {/* Animated Loading Bar */}
            <div style={{ width: "200px", height: "2px", background: "rgba(255,255,255,0.1)", borderRadius: "1px", marginBottom: "2rem", overflow: "hidden" }}>
              <div style={{ 
                width: "100%", height: "100%", background: "linear-gradient(90deg, transparent, #f59e0b, transparent)",
                animation: "loading-magical 2s infinite linear"
              }} />
            </div>

            <p style={{ color: "#94a3b8", fontSize: "0.8rem", maxWidth: "300px", margin: "0 auto 2rem", fontStyle: "italic" }}>
              "O castelo está se reconfigurando. Aguarde um momento enquanto os elfos domésticos terminam a manutenção."
            </p>

            <button 
              onClick={() => window.location.reload()}
              style={{
                background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b", color: "#f59e0b",
                padding: "0.6rem 1.5rem", borderRadius: "0.5rem", fontSize: "0.7rem", 
                cursor: "pointer", textTransform: "uppercase", fontWeight: "bold",
                backdropFilter: "blur(5px)", transition: "all 0.3s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.2)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.1)"}
            >
              Forçar Restauração 🪄
            </button>
          </div>
          
          <style>{`
            @keyframes loading-magical {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
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
