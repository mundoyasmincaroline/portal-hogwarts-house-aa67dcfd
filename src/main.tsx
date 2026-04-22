import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";

// Protocolo 10 Passos à Frente: Version Sentinel
// Incrementando a versão para forçar limpeza de cache em todos os dispositivos móveis
const PORTAL_VERSION = "8.0.0-OMNIPOTENCE-ZION"; 
const storedVersion = localStorage.getItem("portal_version");

if (storedVersion !== PORTAL_VERSION) {
  console.log("Sincronizando nova versão do portal...");
  // Limpeza profunda para evitar que estados antigos quebrem o app no celular
  const theme = localStorage.getItem("theme"); // Preserva apenas o tema
  localStorage.clear();
  sessionStorage.clear();
  if (theme) localStorage.setItem("theme", theme);
  localStorage.setItem("portal_version", PORTAL_VERSION);
  
  // Limpeza de caches de Service Worker
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (let name of names) caches.delete(name);
    });
  }
  
  // Forçar recarga bypassando cache
  window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
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
