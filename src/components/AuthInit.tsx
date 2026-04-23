import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../integrations/supabase/client";
import MagicalSyncOverlay from "./MagicalSyncOverlay";

interface AuthInitProps {
  children: React.ReactNode;
}

export default function AuthInit({ children }: AuthInitProps) {
  const init = useAuth((s) => s.init);
  const [isSyncing, setIsSyncing] = useState(false);
  const hasChecked = React.useRef(false);
  
  useEffect(() => { 
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    init(); 
    
    // Protocolo 10 Passos à Frente: Auto-Update Monitor
    const checkVersion = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "portal_version")
          .maybeSingle();
        
        if (data) {
          const remoteVersion = (data.setting_value as any)?.version;
          const localVersion = localStorage.getItem("portal_version");
          
          if (!localVersion && remoteVersion) {
            localStorage.setItem("portal_version", remoteVersion);
            return;
          }

          if (remoteVersion && localVersion && remoteVersion !== localVersion) {
            console.log("REVOLUTION SYNC: Nova versão detectada. Preparando núcleo...");
            setIsSyncing(true);
            
            // Persistir antes do reload para evitar loop
            localStorage.setItem("portal_version", remoteVersion);

            setTimeout(async () => {
              if ('caches' in window) {
                try {
                  const names = await caches.keys();
                  for (let name of names) await caches.delete(name);
                } catch (e) { console.warn("Cache clear failed", e); }
              }
              window.location.reload();
            }, 2000);
          }
        }
      } catch (err) {
        console.warn("Silent version check failed", err);
      }
    };

    checkVersion();
    
    // Realtime listener para atualizações críticas
    const channelName = `portal_updates_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, payload => {
        if (payload.new.setting_key === 'portal_version') {
          const newVer = payload.new.setting_value?.version;
          const currentVer = localStorage.getItem("portal_version");
          if (newVer && newVer !== currentVer) {
            setIsSyncing(true);
            localStorage.setItem("portal_version", newVer);
            setTimeout(() => window.location.reload(), 2000);
          }
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [init]);
  
  return (
    <>
      {isSyncing && <MagicalSyncOverlay />}
      {children}
    </>
  );
}
