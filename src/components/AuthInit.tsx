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
  
  useEffect(() => { 
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
            console.log("REVOLUTION SYNC: Nova versão detectada via nuvem. Reiniciando...");
            setIsSyncing(true);
            
            setTimeout(async () => {
              localStorage.setItem("portal_version", remoteVersion);
              if ('caches' in window) {
                const names = await caches.keys();
                for (let name of names) await caches.delete(name);
              }
              window.location.reload();
            }, 2500);
          }
        }
      } catch (err) {
        console.warn("Silent version check failed", err);
      }
    };

    checkVersion();
    
    // Realtime listener para atualizações forçadas pelo Arquiteto
    const channel = supabase
      .channel(`portal_updates_${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, payload => {
        if (payload.new.setting_key === 'portal_version') {
          const newVer = payload.new.setting_value?.version;
          if (newVer && newVer !== localStorage.getItem("portal_version")) {
            setIsSyncing(true);
            setTimeout(() => window.location.reload(), 3000);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [init]);
  
  return (
    <>
      {isSyncing && <MagicalSyncOverlay />}
      {children}
    </>
  );
}
