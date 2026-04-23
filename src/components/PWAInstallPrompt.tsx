import React, { useState, useEffect } from "react";
import { Download, Smartphone, Sparkles, X } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIos);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show after 10 seconds of usage if not on iOS (Android/Chrome)
    if (isIos && !window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => setIsVisible(true), 15000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      toast.info("📱 No iPhone: Toque em 'Compartilhar' [↑] e 'Adicionar à Tela de Início'", { duration: 6000 });
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
      toast.success("✨ Portal instalado na sua tela de início!");
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="glass rounded-[2rem] p-6 border-2 border-primary/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <button onClick={() => setIsVisible(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors">
          <X size={18} />
        </button>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-inner group-hover:scale-110 transition-transform">
            <Smartphone size={28} className="text-primary animate-pulse" />
          </div>
          
          <div className="flex-1 pr-6">
            <h4 className="font-heading text-lg text-white leading-tight">Instalar App Mágico</h4>
            <p className="text-xs text-muted-foreground font-serif italic">Transforme o portal em um aplicativo e receba notificações diretas das corujas.</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button onClick={handleInstall} variant="magical" className="flex-1 h-12 rounded-xl text-xs font-bold tracking-widest uppercase shadow-xl">
            {isIOS ? "Ver Tutorial de Instalação" : "Baixar Agora ✨"}
          </Button>
        </div>
      </div>
    </div>
  );
}
