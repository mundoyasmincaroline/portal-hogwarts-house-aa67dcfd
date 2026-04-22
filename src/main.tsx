import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";

// Protocolo 10 Passos à Frente: Version Sentinel
// Incrementando a versão para forçar limpeza de cache e migração global
const PORTAL_VERSION = "8.1.1-REVOLUTION-STABLE"; 
const storedVersion = localStorage.getItem("portal_version");

if (storedVersion !== PORTAL_VERSION) {
  console.log("Sincronizando nova versão do portal...");
  // Limpeza Cirúrgica: Remove versões antigas e caches, mas PRESERVA a sessão de login
  const sessionKey = Object.keys(localStorage).find(key => key.includes('auth-token'));
  const sessionData = sessionKey ? localStorage.getItem(sessionKey) : null;
  const theme = localStorage.getItem("theme");

  localStorage.clear();
  sessionStorage.clear();
  
  if (sessionKey && sessionData) localStorage.setItem(sessionKey, sessionData);
  if (theme) localStorage.setItem("theme", theme);
  localStorage.setItem("portal_version", PORTAL_VERSION);
  
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (let name of names) caches.delete(name);
    });
  }
  
  window.location.replace(window.location.origin + window.location.pathname + '?v=' + Date.now());
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
