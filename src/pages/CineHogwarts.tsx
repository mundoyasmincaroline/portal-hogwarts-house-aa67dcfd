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
        setCinemaConfig(data.value);
        setEditUrl(data.value.url || "");
        setEditTitle(data.value.title || "");
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
        <div className="glass rounded-2xl p-8 text-center border border-border">
          <span className="text-5xl drop-shadow-md">🍿</span>
          <h1 className="font-heading text-3xl text-foreground mt-4 mb-2">Cine Hogwarts</h1>
          <p className="text-muted-foreground text-sm">As portas do cinema estão fechadas no momento.</p>
          <p className="text-xs text-primary mt-2">Aguarde a próxima sessão mágica agendada pela direção!</p>
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
