import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CineHogwarts() {
  const { isAdmin } = useAuth();
  const [cinemaConfig, setCinemaConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    const fetchCinema = async () => {
      const { data } = await supabase.from("system_settings").select("value").eq("key", "cinema_config").single();
      if (data) {
        const val = data.value as { url?: string; title?: string; active?: boolean };
        setCinemaConfig(val);
        setEditUrl(val.url || "");
        setEditTitle(val.title || "");
      }
      setLoading(false);
    };
    fetchCinema();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Arrumando as poltronas mágicas...</div>;
  }

  const saveCinema = async () => {
    const newValue = { url: editUrl, title: editTitle, active: true };
    await supabase.from("system_settings").upsert({ key: "cinema_config", value: newValue } as never);
    setCinemaConfig(newValue);
    setEditMode(false);
    toast.success("Cinema atualizado com sucesso!");
  };

  if (!cinemaConfig || !cinemaConfig.active || !cinemaConfig.url) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {isAdmin && (
          <div className="glass p-4 rounded-xl mb-4 flex gap-2">
            <Input placeholder="Título do Evento" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <Input placeholder="URL do YouTube" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
            <Button variant="magical" onClick={saveCinema}>Salvar Sessão</Button>
          </div>
        )}
        <div className="glass rounded-2xl p-12 text-center border border-primary/20 bg-[url('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"></div>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border border-primary/50 mb-4 animate-pulse-glow">
              <span className="text-4xl">📽️</span>
            </div>
            <h1 className="font-heading text-4xl text-gold-gradient mb-3 drop-shadow-lg">Hogwarts Cine</h1>
            <p className="text-lg text-foreground font-medium max-w-md mx-auto mb-4">
              As portas do grande salão de cinema estão trancadas... 🔒
            </p>
            <div className="bg-background/40 backdrop-blur-sm p-4 rounded-xl border border-primary/20">
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No momento não temos nenhuma sessão agendada. Volte mais tarde ou acompanhe os avisos no Chat Geral para saber quando a mágica irá começar!
              </p>
            </div>
            <div className="mt-8 px-6 py-2 bg-secondary/80 border border-primary/30 rounded-full text-xs font-bold uppercase tracking-widest text-primary animate-pulse">
              Fique de olho nas novidades
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert youtube URL to embed URL
  let embedUrl = cinemaConfig.url;
  if (embedUrl.includes("youtube.com/watch?v=")) {
    embedUrl = embedUrl.replace("watch?v=", "embed/");
  } else if (embedUrl.includes("youtu.be/")) {
    embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");
  }

  // Auto-play and mute might be needed depending on browser policies, but let's keep it simple
  if (embedUrl.includes("youtube.com/embed/")) {
    embedUrl += embedUrl.includes("?") ? "&autoplay=1" : "?autoplay=1";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {isAdmin && (
        <div className="glass p-4 rounded-xl flex gap-2 items-center">
          <span className="text-xs font-bold text-primary mr-2 uppercase tracking-widest">Admin</span>
          <Input placeholder="Título" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <Input placeholder="URL YouTube" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
          <Button variant="magical" onClick={saveCinema}>Atualizar Sessão</Button>
          <Button variant="destructive" onClick={async () => {
             const newValue = { url: "", title: "", active: false };
             await supabase.from("system_settings").upsert({ key: "cinema_config", value: newValue } as never);
             setCinemaConfig(newValue);
          }}>Desligar Tela</Button>
        </div>
      )}

      <div className="glass rounded-2xl p-6 text-center border border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-50"></div>
        <div className="relative z-10">
          <h1 className="font-heading text-3xl text-gold-gradient mb-2 flex items-center justify-center gap-3">
            🎬 {cinemaConfig.title || "Sessão de Cinema Mágica"} 🍿
          </h1>
          <p className="text-muted-foreground text-sm">Pegue seu sapo de chocolate e aproveite a sessão com seus amigos!</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-2 sm:p-4 border border-border shadow-xl">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-primary/30">
          <iframe 
            src={embedUrl} 
            title={cinemaConfig.title}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          ></iframe>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground italic">
          O filme está sendo transmitido através de magia (YouTube). O Salão Comunal permanece silencioso.
        </p>
      </div>
    </div>
  );
}
