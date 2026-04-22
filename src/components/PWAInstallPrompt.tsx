import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Download, Sparkles, Bell } from "lucide-react";
import { toast } from "sonner";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Escutar o evento de instalação do PWA
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar após 5 segundos no dashboard para não ser invasivo logo de cara
      setTimeout(() => setIsVisible(true), 5000);
    });

    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Seu navegador não suporta notificações.");
      return;
    }
    
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    
    if (permission === "granted") {
      toast.success("✨ Feitiço de Notificação Ativado! Você será avisado de eventos importantes.");
      new Notification("Portal Hogwarts", {
        body: "Magia ativada! Você agora receberá nossas corujas.",
        icon: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b1b5eac1-02b9-4d55-bfd1-d80f6573fc4f"
      });
    } else {
      toast.error("O feitiço falhou. Você precisa permitir as notificações no seu navegador.");
    }
  };

  if (!isVisible && notifPermission === "granted") return null;

  return (
    <div className={`fixed bottom-24 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-700 ${!isVisible && notifPermission !== "default" ? 'hidden' : ''}`}>
      <div className="glass bg-black/90 border-2 border-primary/30 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-900/10" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shrink-0">
            <Download size={32} className="text-primary animate-bounce" />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-heading text-xl text-white flex items-center justify-center md:justify-start gap-2">
              Instalar App Hogwarts <Sparkles size={16} className="text-yellow-400" />
            </h3>
            <p className="text-sm text-muted-foreground font-serif italic">
              "Para receber nossas corujas em tempo real e não perder nenhum evento, instale o portal no seu celular."
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isVisible && deferredPrompt && (
              <Button variant="magical" onClick={handleInstall} className="rounded-xl h-12 px-6">
                Instalar App 📱
              </Button>
            )}
            
            {notifPermission === "default" && (
              <Button variant="outline" onClick={handleEnableNotifications} className="rounded-xl h-12 px-6 border-primary/30 hover:bg-primary/10">
                Ativar Corujas <Bell size={16} className="ml-2" />
              </Button>
            )}
            
            <button 
              onClick={() => {
                setIsVisible(false);
                // Armazenar preferência para não mostrar novamente nesta sessão
                sessionStorage.setItem("pwa_prompt_dismissed", "true");
              }}
              className="text-[10px] text-muted-foreground uppercase tracking-widest hover:text-white mt-2 sm:mt-0 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
