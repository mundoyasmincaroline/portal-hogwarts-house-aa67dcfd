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
        <div style={{
          height: "100vh", width: "100vw", background: "#050505", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          flexDirection: "column", color: "#34d399", fontFamily: "monospace",
          textAlign: "center", padding: "40px"
        }}>
          <div style={{ 
            border: "1px solid #065f46", background: "rgba(6, 95, 70, 0.05)", 
            padding: "40px", borderRadius: "30px", maxWidth: "600px",
            boxShadow: "0 0 50px rgba(52, 211, 153, 0.1)"
          }}>
            <h1 style={{ fontSize: "1.2rem", letterSpacing: "0.5em", color: "#10b981", marginBottom: "20px" }}>
              ZION SYSTEM FAILURE
            </h1>
            <div style={{ textAlign: "left", background: "#000", padding: "20px", borderRadius: "10px", border: "1px solid #065f46" }}>
              <p style={{ color: "#059669", fontSize: "12px", marginBottom: "10px" }}>[DIAGNÓSTICO TÉCNICO]</p>
              <p style={{ color: "#34d399", fontSize: "10px", lineHeight: "1.6" }}>{this.state.error?.message}</p>
            </div>
            <p style={{ fontSize: "10px", color: "#065f46", marginTop: "20px", fontStyle: "italic" }}>
              "O erro foi reportado ao Arquiteto. A realidade está sendo recalibrada."
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: "30px", background: "#10b981", color: "#000", 
                border: "none", padding: "12px 30px", borderRadius: "50px", 
                cursor: "pointer", fontWeight: "bold", fontSize: "10px", letterSpacing: "2px"
              }}
            >
              RESTAURAR PORTAL
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MagicalErrorBoundary;
