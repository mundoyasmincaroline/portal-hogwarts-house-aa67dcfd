import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";

// Protocolo 10 Passos à Frente: Version Sentinel
// Incrementando a versão para forçar limpeza de cache e migração global
const PORTAL_VERSION = "8.2.5-ZION-REVOLUTION"; 
const storedVersion = localStorage.getItem("portal_version");

if (storedVersion !== PORTAL_VERSION) {
  console.log("REVOLUTION SYNC: Sincronizando nova versão do portal: " + PORTAL_VERSION);
  
  // Proteção contra loop infinito
  const syncAttempts = parseInt(localStorage.getItem("sync_attempts") || "0");
  const lastSync = parseInt(localStorage.getItem("last_sync_time") || "0");
  const now = Date.now();

  if (syncAttempts > 3 && (now - lastSync) < 60000) {
    console.error("ZION_CRITICAL: Falha persistente na sincronização. Abortando para evitar loop.");
    localStorage.setItem("portal_version", PORTAL_VERSION); // Força marcação para parar
  } else {
    localStorage.setItem("sync_attempts", (syncAttempts + 1).toString());
    localStorage.setItem("last_sync_time", now.toString());
    
    // Limpeza Cirúrgica: Preserva a sessão
    const authKeys = Object.keys(localStorage).filter(k => k.includes('auth-token') || k.includes('supabase.auth.token'));
    const savedData: Record<string, string> = {};
    authKeys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val) savedData[k] = val;
    });

    localStorage.clear();
    sessionStorage.clear();
    
    Object.entries(savedData).forEach(([k, v]) => localStorage.setItem(k, v));
    localStorage.setItem("portal_version", PORTAL_VERSION);
    
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (let name of names) caches.delete(name);
      });
    }
    
    // Reload limpo
    window.location.replace(window.location.origin + window.location.pathname + '?v=' + PORTAL_VERSION);
  }
} else {
  // Reset attempts if successful
  localStorage.setItem("sync_attempts", "0");
}

// Registro do Service Worker para PWA (Hogwarts no Bolso)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Verifica atualizações silenciosamente
      reg.update();
      
      // Se houver um novo worker esperando, avisa o sistema
      reg.onupdatefound = () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.onstatechange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log("Nova versão detectada. Preparando auto-update...");
            }
          };
        }
      };
    }).catch(err => console.log('SW registration failed:', err));
  });
}


const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Falha ao encontrar o elemento raiz do portal.");

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
