import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  link: string;
  image_url: string;
  ad_type: string;
}

export default function InterstitialAd() {
  const [activeAd, setActiveAd] = useState<Ad | null>(null);
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const location = useLocation();

  const { profile } = useAuth();

  useEffect(() => {
    checkAndShowAd();
  }, [location.pathname, profile?.vip_plan]); // Triggered sometimes on navigation or VIP status change

  const checkAndShowAd = async () => {
    if (show) return; // already showing
    if (profile?.vip_plan) return; // VIPs don't see interstitials

    // Check settings
    const { data: settingsData } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "interstitial_config").single();
    if (!settingsData) return;
    
    const config = settingsData.setting_value as any;
    if (!config.enabled) return;

    // Check last shown time to respect interval
    const lastShownStr = sessionStorage.getItem("last_interstitial_time");
    if (lastShownStr) {
      const last = parseInt(lastShownStr);
      const diffMinutes = (Date.now() - last) / 1000 / 60;
      if (diffMinutes < (config.interval_minutes || 5)) return; // Too soon
    }

    // 30% chance to show on navigation if interval has passed
    if (Math.random() > 0.3) return;

    // Fetch an active interstitial ad
    const { data: adsData } = await supabase.from("ads").select("*").eq("active", true).eq("ad_type", "interstitial");
    if (!adsData || adsData.length === 0) return;

    // Pick random
    const randomAd = adsData[Math.floor(Math.random() * adsData.length)];
    
    setActiveAd(randomAd);
    setShow(true);
    setCountdown(5);
    sessionStorage.setItem("last_interstitial_time", Date.now().toString());

    // Countdown logic
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const closeAd = () => {
    if (countdown === 0) setShow(false);
  };

  if (!show || !activeAd) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full bg-card border border-primary/20 shadow-[0_0_50px_rgba(255,215,0,0.1)] rounded-2xl overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-500">
        
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {countdown > 0 ? (
            <span className="text-sm font-heading text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              Pule em {countdown}s
            </span>
          ) : (
            <button onClick={closeAd} className="bg-secondary/80 hover:bg-secondary p-2 rounded-full text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <span className="text-xs uppercase font-bold tracking-widest text-primary mb-4 block">Oferta Especial do Beco Diagonal</span>
        
        <h2 className="font-heading text-3xl text-gold-gradient mb-6">{activeAd.title}</h2>
        
        {activeAd.image_url && (
          <a href={activeAd.link} target="_blank" rel="noreferrer" className="block w-full max-w-md mx-auto mb-8 rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-colors">
            <img src={activeAd.image_url} alt={activeAd.title} className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-700" />
          </a>
        )}

        <Button asChild size="lg" variant="magical" className="w-full max-w-md text-lg h-14">
          <a href={activeAd.link} target="_blank" rel="noreferrer">
            Aproveitar Oferta
          </a>
        </Button>
      </div>
    </div>
  );
}
