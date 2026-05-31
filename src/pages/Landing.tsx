import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { type House } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Zap, Crown, Users, ShoppingBag, Trophy, MessageCircle, Sparkles, Flame } from "lucide-react";
import HouseCupWidget from "@/components/rpg/HouseCupWidget";
import MagicalEmoji from "@/components/shared/MagicalEmoji";
import MagicalIcon from "@/components/shared/MagicalIcon";

const HOUSES_INFO: { id: House; name: string; color: string; animal: string; trait: string }[] = [
  { id: "gryffindor", name: "Grifinória", color: "from-red-900/80 to-yellow-900/60 border-red-500/50", animal: "🦁", trait: "Coragem & Bravura" },
  { id: "slytherin",  name: "Sonserina",  color: "from-green-900/80 to-slate-900/60 border-green-500/50", animal: "🐍", trait: "Ambição & Astúcia" },
  { id: "ravenclaw",  name: "Corvinal",   color: "from-blue-900/80 to-slate-900/60 border-blue-500/50", animal: "🦅", trait: "Sabedoria & Criatividade" },
  { id: "hufflepuff", name: "Lufa-Lufa",  color: "from-yellow-900/80 to-stone-900/60 border-yellow-500/50", animal: "🦡", trait: "Lealdade & Paciência" },
];

const FEATURES = [
  { icon: Users, title: "Comunidade RPG", desc: "Feed, DMs, amigos e stories. Viva Hogwarts com outros fãs.", color: "#60a5fa", cardColor: "border-blue-500/20 bg-blue-900/5" },
  { icon: ShoppingBag, title: "Gringotts Store", desc: "Mantos, varinhas, amuletos e itens mágicos com Galeões.", color: "#fbbf24", cardColor: "border-yellow-500/20 bg-yellow-900/5" },
  { icon: Trophy, title: "Álbum de Figurinhas", desc: "Colecione personagens raros e complete seu álbum mágico.", color: "#f59e0b", cardColor: "border-amber-500/20 bg-amber-900/5" },
  { icon: Zap, title: "Gamificação Extrema", desc: "XP, níveis, conquistas, ranking das casas e desafios diários.", color: "#a855f7", cardColor: "border-purple-500/20 bg-purple-900/5" },
  { icon: Crown, title: "VIP & Recompensas", desc: "Planos VIP com Galeões mensais, skins exclusivas e badges.", color: "#fb7185", cardColor: "border-rose-500/20 bg-rose-900/5" },
  { icon: MessageCircle, title: "Chats & Casas", desc: "Salas de RPG por casa, missões coletivas e eventos ao vivo.", color: "#10b981", cardColor: "border-green-500/20 bg-green-900/5" },
];

const TESTIMONIALS = [
  { house: "gryffindor", emoji: "🦁", name: "Ana L.", quote: "Finalmente um portal que parece de verdade! Me sinto dentro de Hogwarts a cada clique.", color: "border-red-500/20 bg-red-900/5" },
  { house: "slytherin",  emoji: "🐍", name: "Marcos V.", quote: "As figurinhas são viciantes demais. O sistema de trocas e o álbum são impecáveis!", color: "border-green-500/20 bg-green-900/5" },
  { house: "ravenclaw",  emoji: "🦅", name: "Julia R.", quote: "O sistema de Galeões e a loja são incríveis. Itens raros que realmente dão status.", color: "border-blue-500/20 bg-blue-900/5" },
  { house: "hufflepuff", emoji: "🦡", name: "Pedro S.", quote: "A comunidade é super acolhedora. O RPG no chat é o melhor que já participei.", color: "border-yellow-500/20 bg-yellow-900/5" },
  { house: "gryffindor", emoji: "⚔️", name: "Lucas M.", quote: "Os duelos e a disputa pela Taça das Casas me fazem querer entrar todo dia!", color: "border-red-500/20 bg-red-900/5" },
  { house: "ravenclaw",  emoji: "📖", name: "Clara B.", quote: "A imersão é total. As notificações por coruja são um toque de mestre.", color: "border-blue-500/20 bg-blue-900/5" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 600);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearTimeout(t); clearInterval(timer); };
  }, []);

  useEffect(() => {
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .then(({ count }) => setMemberCount(Math.max(count ?? 0, 10)));
  }, []);

  const hour = new Date().getHours();
  let timeOfDay = "night";
  if (hour >= 5 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 18) timeOfDay = "afternoon";

  let bgUrl = new URL('../assets/hogwarts_night.png', import.meta.url).href;
  if (timeOfDay === "morning") bgUrl = new URL('../assets/hogwarts_morning.png', import.meta.url).href;
  else if (timeOfDay === "afternoon") bgUrl = new URL('../assets/hogwarts_afternoon.png', import.meta.url).href;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <MagicalParticles />

      {/* ── HERO ── */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={bgUrl} alt="Hogwarts Castle" className="w-full h-full object-cover scale-105 animate-[float_20s_ease-in-out_infinite]" />
          {/* Cinematic depth: vignette + atmospheric tint + gold rim */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_transparent_45%,_rgba(0,0,0,0.85)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/15 via-transparent to-blue-900/20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.10),_transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
          {/* Subtle star field */}
          <div className="absolute inset-0 opacity-[0.18] mix-blend-screen" style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 70% 60%, white, transparent), radial-gradient(1px 1px at 40% 80%, white, transparent), radial-gradient(1px 1px at 85% 20%, white, transparent), radial-gradient(1px 1px at 10% 65%, white, transparent), radial-gradient(1px 1px at 55% 15%, white, transparent)", backgroundSize: "800px 800px" }} />
        </div>

        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            <span className="font-heading text-lg text-gold-gradient drop-shadow-md">✦ Hogwarts House</span>
            <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">
              {currentTime.toLocaleDateString("pt-BR")} · {currentTime.toLocaleTimeString("pt-BR")}
            </span>
          </div>
          <button onClick={() => navigate("/login")}
            className="text-sm font-heading text-white bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:border-primary/50 transition-all px-5 py-2 rounded-full shadow-lg">
            Entrar
          </button>
        </div>

        <div className={`relative z-20 pt-24 md:pt-0 transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={12} className="text-primary animate-pulse" />
            <span className="text-xs font-heading text-primary tracking-widest uppercase">Portal Oficial de Fãs · RPG & Comunidade</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-8xl lg:text-[10rem] font-heading text-gold-gradient mb-6 sm:mb-8 tracking-tighter drop-shadow-[0_15px_45px_rgba(212,175,55,0.5)] animate-in fade-in zoom-in duration-1000 break-words leading-[0.85] active:scale-95 transition-transform cursor-default">
            Hogwarts House
          </h1>
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-6 sm:gap-10 mb-10 sm:mb-12 max-w-xs sm:max-w-none mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <div className="relative group text-center">
              <p className="font-heading text-2xl sm:text-4xl text-gold-gradient">{memberCount !== null ? memberCount.toLocaleString("pt-BR") : "10"}</p>
              <p className="text-[9px] sm:text-[10px] text-primary/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold">Bruxos</p>
            </div>
            
            <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden sm:block" />
            
            <div className="relative group text-center border-l border-primary/10 sm:border-none pl-6 sm:pl-0">
              <p className="font-heading text-2xl sm:text-4xl text-gold-gradient">4</p>
              <p className="text-[9px] sm:text-[10px] text-primary/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold">Casas</p>
            </div>

            <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden sm:block" />

            <div className="relative group text-center">
              <p className="font-heading text-2xl sm:text-4xl text-gold-gradient">80+</p>
              <p className="text-[9px] sm:text-[10px] text-primary/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold">Itens</p>
            </div>

            <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden sm:block" />

            <div className="relative group text-center border-l border-primary/10 sm:border-none pl-6 sm:pl-0">
              <p className="font-heading text-2xl sm:text-4xl text-gold-gradient">∞</p>
              <p className="text-[9px] sm:text-[10px] text-primary/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold">Magia</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 px-4 w-full max-w-lg mx-auto">
            <Button variant="magical" size="lg" onClick={() => navigate("/register")}
              className="w-full sm:flex-1 font-heading text-lg px-8 h-16 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all">
              <Sparkles size={18} className="mr-2" />
              Entrar agora
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/login")}
              className="w-full sm:w-auto font-heading text-base px-8 h-16 border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 active:scale-95 transition-all">
              Já sou bruxo
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground/60">
            Gratuito para entrar · Conteúdo premium disponível na Gringotts
          </p>
        </div>
      </div>

      {/* ── CASAS ── */}
      <div className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-heading text-primary uppercase tracking-widest mb-2">Escolha seu destino</p>
          <h2 className="font-heading text-3xl md:text-4xl text-foreground">Qual é a sua casa?</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
            O Chapéu Seletor aguarda. Entre no portal e descubra onde você pertence.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {HOUSES_INFO.map(h => (
            <div key={h.id} onClick={() => navigate("/register")}
              className={`relative glass rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border-2 bg-gradient-to-br ${h.color} text-center cursor-pointer hover:-translate-y-3 sm:hover:-translate-y-5 hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-700 group flex flex-col items-center gap-4 sm:gap-6 overflow-hidden`}>
              
              {/* Inner Glow Artifact */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 w-24 h-24 flex items-center justify-center rounded-3xl bg-black/40 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-700">
                <img src={`/houses/${h.id}.png`} alt={h.name} className="w-20 h-20 object-contain group-hover:rotate-6 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
              </div>

              
              <div className="relative z-10">
                <h3 className="font-heading text-2xl text-foreground mb-2 drop-shadow-md">{h.name}</h3>
                <p className="text-[10px] text-white/60 uppercase tracking-[0.3em] font-bold px-3 py-1 bg-black/30 rounded-full border border-white/5">{h.trait}</p>
              </div>
              
              {/* Luxury Accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* ── HOUSE CUP LANDING ── */}
      <div className="relative z-10 px-4 py-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <p className="text-[10px] font-heading text-primary/80 uppercase tracking-[0.3em]">Taça das Casas · ao vivo</p>
          <span className="text-[10px] font-mono text-white/40">tempo real</span>
        </div>
        <HouseCupWidget isLanding={true} />
      </div>

      {/* ── FEATURES ── */}
      <div className="relative z-10 px-4 py-16 bg-gradient-to-b from-transparent via-secondary/20 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-heading text-primary uppercase tracking-widest mb-2">Tudo que você precisa</p>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground">O portal mais completo do fandom</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className={`group/feat glass rounded-[2.5rem] p-8 border ${f.cardColor} hover:-translate-y-2 transition-all duration-500 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/feat:opacity-100 transition-opacity" />
                <div className="mb-6">
                   <MagicalIcon icon={f.icon} color={f.color} size={24} />
                </div>
                <h3 className="font-heading text-xl text-foreground mb-2 group-hover/feat:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed italic">{f.desc}</p>
                
                {/* Luxury Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MONETIZAÇÃO FLASH SALE (URGÊNCIA MÁXIMA) ── */}
      <div className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <div className="glass rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-16 border-2 border-red-500/40 bg-gradient-to-br from-red-950/60 via-black to-amber-950/40 relative overflow-hidden shadow-[0_0_80px_rgba(220,38,38,0.3)] group">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/80 to-transparent animate-shimmer" />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-pulse" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-3 bg-red-500/20 border border-red-500/40 rounded-full px-5 py-1.5 mb-2">
                <Flame size={14} className="text-red-500 animate-pulse" />
                <span className="text-xs font-heading text-red-100 uppercase tracking-[0.2em] font-bold">OFERTA DE LANÇAMENTO · LIMITADA</span>
              </div>
              
              <h2 className="font-heading text-4xl md:text-6xl text-white tracking-tighter leading-none">
                ESTA SEMANA É <br/><span className="text-red-500">GRÁTIS?</span> QUASE ISSO.
              </h2>
              
              <p className="text-lg text-red-100/70 font-serif italic max-w-xl">
                "Itens lendários por 1 Galeão e pacotes VIP com 50% de desconto. O Ministério da Magia enlouqueceu por apenas 72 horas."
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto md:mx-0">
                <div className="glass bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Itens a partir de</p>
                  <p className="text-3xl font-heading text-yellow-400">R$ 1,90</p>
                </div>
                <div className="glass bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">VIP Founders</p>
                  <p className="text-3xl font-heading text-purple-400">-50%</p>
                </div>
              </div>
              
              <Button size="lg" variant="magical" onClick={() => navigate("/register")} className="h-20 px-12 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-red-600 border-none font-bold text-2xl shadow-[0_15px_40px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all w-full sm:w-auto">
                ENTRAR E PEGAR AGORA <ChevronRight size={24} className="ml-2" />
              </Button>
            </div>
            
            <div className="shrink-0 relative">
               <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] animate-bounce" />
               <img src="/legendary_chest_3d_v2.png" alt="Chest" className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-float" />
            </div>
          </div>
        </div>
      </div>

      {/* ── DEPOIMENTOS ── */}
      <div className="relative z-10 px-4 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-heading text-primary uppercase tracking-widest mb-2">O que dizem os membros</p>
          <h2 className="font-heading text-2xl text-foreground">Bruxos reais, experiências reais</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className={`group/test glass rounded-[2rem] p-8 border ${t.color} hover:-translate-y-2 transition-all duration-500 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/test:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <MagicalEmoji emoji={t.emoji} size="sm" />
                  <div className="w-8 h-px bg-white/10" />
                </div>
                <p className="text-sm text-foreground/90 italic leading-relaxed">"{t.quote}"</p>
                <div className="mt-2 flex items-center gap-2">
                   <div className="w-6 h-px bg-primary/30" />
                   <p className="text-[10px] text-primary font-heading uppercase tracking-widest">{t.name}</p>
                </div>
              </div>
              
              {/* Magic Sparkle Effect */}
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000" />
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA FINAL - MONSTER QUALITY ── */}
      <div className="relative z-10 px-4 py-24 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto relative group">
          {/* Background Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-[120px] opacity-30 animate-pulse pointer-events-none" />
          
          <div className="relative glass rounded-[3rem] p-12 md:p-20 border border-white/10 bg-gradient-to-br from-black/80 via-zinc-900/40 to-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.7)] overflow-hidden">
            {/* Parchment Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10 pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-center">
                 <div className="w-20 h-20 bg-primary/10 rounded-full border border-primary/30 flex items-center justify-center shadow-2xl animate-float-slow">
                   <Zap size={40} className="text-primary drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                 </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-heading text-4xl md:text-7xl text-gold-gradient tracking-tighter leading-tight drop-shadow-2xl">
                  Sua carta de Hogwarts <br className="hidden md:block" /> chegou.
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
                <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed font-serif italic">
                  "O mundo dos trouxas é pequeno demais para você. <br className="hidden sm:block" />
                  A verdadeira magia começa agora."
                </p>
              </div>

              <div className="pt-4">
                <Button variant="magical" size="lg" onClick={() => navigate("/register")}
                  className="w-full sm:w-auto max-w-sm mx-auto font-heading text-xl px-16 py-8 h-auto shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all rounded-3xl group/btn flex items-center justify-center">
                  <Sparkles size={24} className="mr-3 group-hover/btn:rotate-12 transition-transform" />
                  Solicitar minha vaga agora
                  <ChevronRight size={20} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2 pt-4">
                <p className="text-[11px] text-primary/40 uppercase tracking-[0.4em] font-bold">Vagas limitadas para o próximo ano letivo</p>
                <div className="flex gap-2">
                   {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20" />)}
                </div>
              </div>
            </div>
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/10 to-transparent blur-2xl" />
          </div>
        </div>
      </div>

      {/* ── FOOTER MONSTER QUALITY ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-12 bg-black/40 backdrop-blur-3xl overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
            {/* Column 1: Brand */}
            <div className="space-y-4">
               <span className="font-heading text-xl text-gold-gradient tracking-tight">✦ Hogwarts House</span>
               <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-xs mx-auto md:mx-0">
                 O portal de elite para a comunidade bruxa. Viva sua própria história em Hogwarts com tecnologia e magia.
               </p>
            </div>
            
            {/* Column 2: Links */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-heading text-primary uppercase tracking-[0.3em] font-bold">Ministério</h4>
                <div className="flex flex-col gap-2">
                  <button onClick={() => navigate("/terms")} className="text-xs text-muted-foreground/50 hover:text-primary transition-colors">Termos de Uso</button>
                  <button onClick={() => navigate("/privacy")} className="text-xs text-muted-foreground/50 hover:text-primary transition-colors">Privacidade</button>
                  <button onClick={() => navigate("/parents")} className="text-xs text-primary/60 hover:text-primary transition-colors font-bold">Para os Pais 🛡️</button>
                  <button onClick={() => navigate("/register")} className="text-xs text-muted-foreground/50 hover:text-primary transition-colors">Solicitar Vaga</button>

                </div>
            </div>

            {/* Column 3: Disclaimer */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-heading text-primary uppercase tracking-[0.3em] font-bold">Aviso Legal</h4>
               <p className="text-[10px] text-muted-foreground/40 leading-relaxed italic">
                 Hogwarts House é um projeto independente de fã para fã. Não possuímos afiliação com a Warner Bros. Entertainment Inc. 
                 ou J.K. Rowling. Todos os direitos reservados aos seus respectivos detentores mágicos.
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 pt-12 border-t border-white/5">
            <div className="space-y-4">
              <h4 className="font-heading text-xs text-primary uppercase tracking-[0.2em] font-bold">Portal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/70">
                <li><Link to="/register" className="hover:text-primary transition-colors">Solicitar Vaga</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Acessar Castelo</Link></li>
                <li><Link to="/parents" className="hover:text-primary transition-colors">Guia para Pais</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-heading text-xs text-primary uppercase tracking-[0.2em] font-bold">Jurídico</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/70">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacidade</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-heading text-xs text-primary uppercase tracking-[0.2em] font-bold">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground/70">
                <li><a href="mailto:mundoyasmincaroline@gmail.com" className="hover:text-primary transition-colors underline decoration-primary/30">mundoyasmincaroline@gmail.com</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[9px] text-muted-foreground/30 font-mono tracking-widest uppercase">
              ✦ Mundo Yasmin Caroline · 2026 · Todos os Direitos Mágicos Reservados ✦
            </p>
            <div className="flex items-center gap-6">
               <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Monster Quality Build 4.2</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
