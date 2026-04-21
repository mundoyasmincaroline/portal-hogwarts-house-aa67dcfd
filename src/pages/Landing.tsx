import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Star, Zap, Crown, BookOpen, Users, ShoppingBag, Trophy, MessageCircle, Sparkles } from "lucide-react";

const HOUSES: { id: House; name: string; color: string; animal: string; trait: string }[] = [
  { id: "gryffindor", name: "Grifinória", color: "from-red-900/80 to-yellow-900/60 border-red-500/50", animal: "🦁", trait: "Coragem & Bravura" },
  { id: "slytherin",  name: "Sonserina",  color: "from-green-900/80 to-slate-900/60 border-green-500/50", animal: "🐍", trait: "Ambição & Astúcia" },
  { id: "ravenclaw",  name: "Corvinal",   color: "from-blue-900/80 to-slate-900/60 border-blue-500/50", animal: "🦅", trait: "Sabedoria & Criatividade" },
  { id: "hufflepuff", name: "Lufa-Lufa",  color: "from-yellow-900/80 to-stone-900/60 border-yellow-500/50", animal: "🦡", trait: "Lealdade & Paciência" },
];

const FEATURES = [
  { icon: <Users size={22} className="text-blue-400" />, title: "Comunidade RPG", desc: "Feed, DMs, amigos e stories. Viva Hogwarts com outros fãs.", color: "border-blue-500/30 bg-blue-900/10" },
  { icon: <ShoppingBag size={22} className="text-yellow-400" />, title: "Gringotts Store", desc: "Mantos, varinhas, amuletos e itens mágicos com Galeões.", color: "border-yellow-500/30 bg-yellow-900/10" },
  { icon: <Trophy size={22} className="text-amber-400" />, title: "Álbum de Figurinhas", desc: "Colecione personagens raros e complete seu álbum mágico.", color: "border-amber-500/30 bg-amber-900/10" },
  { icon: <Zap size={22} className="text-purple-400" />, title: "Gamificação Extrema", desc: "XP, níveis, conquistas, ranking das casas e desafios diários.", color: "border-purple-500/30 bg-purple-900/10" },
  { icon: <Crown size={22} className="text-rose-400" />, title: "VIP & Recompensas", desc: "Planos VIP com Galeões mensais, skins exclusivas e badges.", color: "border-rose-500/30 bg-rose-900/10" },
  { icon: <MessageCircle size={22} className="text-green-400" />, title: "Chats & Casas", desc: "Salas de RPG por casa, missões coletivas e eventos ao vivo.", color: "border-green-500/30 bg-green-900/10" },
];

const TESTIMONIALS = [
  { house: "gryffindor", emoji: "🦁", name: "Ana L.", quote: "Finalmente um portal que parece de verdade! Me sinto dentro de Hogwarts." },
  { house: "slytherin",  emoji: "🐍", name: "Marcos V.", quote: "As figurinhas são viciantes demais. Já completei metade do álbum!" },
  { house: "ravenclaw",  emoji: "🦅", name: "Julia R.", quote: "O sistema de Galeões e a loja são incrívels. Quero mais itens!" },
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
      <div className="relative min-h-[110vh] flex flex-col items-center md:justify-center justify-start px-4 text-center overflow-hidden pt-32 md:pt-0">
        <div className="absolute inset-0 z-0">
          <img src={bgUrl} alt="Hogwarts Castle" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-background" />
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-6 md:px-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl border border-primary/40 flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
               <Trophy size={20} className="text-primary" />
            </div>
            <span className="font-heading text-xl text-gold-gradient drop-shadow-md tracking-tighter">Hogwarts House</span>
          </div>
          <button onClick={() => navigate("/login")}
            className="group relative px-8 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white font-heading text-sm overflow-hidden transition-all hover:scale-105 hover:border-primary/50">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">Entrar no Castelo</span>
          </button>
        </div>

        <div className={`relative z-20 w-full max-w-6xl transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

          {/* Next Event Indicator - Monster Quality */}
          <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-2xl border border-primary/30 rounded-2xl px-6 py-2.5 mb-8 shadow-2xl animate-bounce-slow">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-md rounded-full animate-pulse" />
              <Sparkles size={16} className="text-primary relative z-10" />
            </div>
            <span className="text-[10px] md:text-xs font-heading text-white uppercase tracking-[0.3em]">Próximo Evento Global em: <span className="text-primary ml-1">02:14:55</span></span>
          </div>

          {/* Main Title Area */}
          <div className="relative mb-12">
            <h1 className="font-heading text-5xl sm:text-7xl md:text-9xl text-gold-gradient mb-4 tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-fade-in">
              Hogwarts House
            </h1>
            <div className="flex items-center justify-center gap-4">
               <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary/50" />
               <p className="text-xs md:text-sm font-heading text-primary uppercase tracking-[0.5em] opacity-80">Onde a Magia Ganha Vida</p>
               <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          </div>

          {/* House Cup Preview - Monster Quality 3D */}
          <div className="max-w-4xl mx-auto mb-16 px-4">
             <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-white/[0.08] to-black/60 backdrop-blur-2xl p-6 md:p-8 border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.7)] group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl border border-yellow-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                         <Trophy size={30} className="text-yellow-400 animate-pulse" />
                      </div>
                      <div className="text-left">
                         <h3 className="font-heading text-xl text-white tracking-tight">Copa das Casas em Tempo Real</h3>
                         <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sonserina está na frente por 120 pontos!</p>
                      </div>
                   </div>
                   <div className="flex -space-x-3">
                      {['🐍', '🦁', '🦅', '🦡'].map((emoji, i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-lg shadow-xl relative z-[i]">
                          {emoji}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { name: "Grifinória", color: "from-red-500 via-red-600 to-red-950", progress: "65%", icon: "🦁" },
                     { name: "Sonserina", color: "from-green-400 via-green-600 to-green-950", progress: "82%", icon: "🐍" },
                     { name: "Corvinal", color: "from-blue-400 via-blue-600 to-blue-950", progress: "45%", icon: "🦅" },
                     { name: "Lufa-Lufa", color: "from-yellow-400 via-amber-600 to-amber-950", progress: "30%", icon: "🦡" }
                   ].map((house) => (
                     <div key={house.name} className="space-y-2 group/house">
                        <div className="flex justify-between items-end px-1">
                           <span className="text-[9px] font-heading text-white/60 uppercase tracking-widest">{house.name}</span>
                           <span className="text-[9px] font-heading text-white/30">{house.progress}</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full border border-white/5 p-[1.5px] relative overflow-hidden">
                           <div 
                             className={`h-full rounded-full bg-gradient-to-r ${house.color} transition-all duration-1000 ease-out relative`}
                             style={{ width: house.progress }}
                           >
                              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-40" />
                              <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] -translate-x-full group-hover/house:translate-x-full transition-transform duration-1000" />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* CTA Area */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate("/register")}
              className="relative group px-12 py-5 rounded-2xl bg-primary text-white font-heading text-lg tracking-widest overflow-hidden shadow-[0_15px_40px_hsl(var(--primary)/0.3)] hover:scale-105 hover:shadow-primary/50 transition-all active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center gap-3">
                 <Sparkles size={20} className="animate-spin-slow" />
                 SOLICITAR MINHA VAGA AGORA
                 <ChevronRight size={20} />
              </div>
            </button>
            
            <button 
              onClick={() => navigate("/login")}
              className="px-10 py-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white font-heading text-lg tracking-widest hover:bg-white/10 hover:border-white/20 transition-all"
            >
              JÁ TENHO CONTA
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 text-[10px] text-white/40 font-heading uppercase tracking-[0.2em]">
             <span className="flex items-center gap-2"><Zap size={12} className="text-primary" /> {memberCount?.toLocaleString()}+ Bruxos Ativos</span>
             <div className="w-1 h-1 bg-white/20 rounded-full" />
             <span className="flex items-center gap-2"><Crown size={12} className="text-yellow-500" /> Vagas de Fundador Abertas</span>
          </div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {HOUSES.map(h => (
            <div key={h.id} onClick={() => navigate("/register")}
              className={`glass rounded-2xl p-5 border bg-gradient-to-br ${h.color} text-center cursor-pointer hover:-translate-y-2 hover:shadow-lg transition-all duration-300 group`}>
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{h.animal}</div>
              <h3 className="font-heading text-base text-foreground">{h.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{h.trait}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="relative z-10 px-4 py-16 bg-gradient-to-b from-transparent via-secondary/20 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-heading text-primary uppercase tracking-widest mb-2">Tudo que você precisa</p>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground">O portal mais completo do fandom</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className={`glass rounded-2xl p-5 border ${f.color} hover:-translate-y-1 transition-transform`}>
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-heading text-base text-foreground mb-1">{f.title}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MONETIZAÇÃO PREVIEW ── */}
      <div className="relative z-10 px-4 py-16 max-w-4xl mx-auto">
        <div className="glass rounded-3xl p-8 md:p-10 border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-amber-900/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1 mb-4">
                <Crown size={12} className="text-yellow-400" />
                <span className="text-[10px] font-heading text-yellow-400 uppercase tracking-widest">Gringotts · VIP</span>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-3">
                Galeões, itens e status de bruxo premium
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Compre Galeões para adquirir itens exclusivos na loja. Assine o VIP e receba Galeões todo mês, badge exclusivo, XP bônus e acesso a conteúdos secretos.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-5">
                {["👑 VIP a partir de R$9,90/mês", "🪙 Galeões a partir de R$4,90", "✨ Cancele quando quiser"].map(b => (
                  <span key={b} className="text-[11px] bg-yellow-900/30 border border-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">{b}</span>
                ))}
              </div>
              <Button variant="magical" onClick={() => navigate("/register")} className="font-heading">
                Entrar e ver a loja <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
            <div className="shrink-0 grid grid-cols-2 gap-3 w-full md:w-auto">
              {[
                { icon: "👑", label: "Fundador", price: "R$ 39,90/mês", glow: "border-yellow-400/50" },
                { icon: "💜", label: "VIP",      price: "R$ 19,90/mês", glow: "border-purple-400/50" },
                { icon: "⭐", label: "Premium",  price: "R$ 9,90/mês",  glow: "border-slate-400/40" },
                { icon: "🪙", label: "Galeões",  price: "a partir de R$4,90", glow: "border-amber-500/40" },
              ].map(p => (
                <div key={p.label} className={`glass rounded-xl p-4 border ${p.glow} text-center hover:scale-105 transition-transform`}>
                  <div className="text-2xl mb-1">{p.icon}</div>
                  <p className="font-heading text-xs text-foreground">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.price}</p>
                </div>
              ))}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-border/30">
              <div className="text-2xl mb-3">{t.emoji}</div>
              <p className="text-sm text-foreground italic mb-3">"{t.quote}"</p>
              <p className="text-xs text-muted-foreground font-heading">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div className="relative z-10 px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="font-heading text-3xl md:text-5xl text-gold-gradient mb-4">
            Sua carta de Hogwarts chegou.
          </h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Não perca mais tempo no mundo dos trouxas. A comunidade está te esperando.
          </p>
          <Button variant="magical" size="lg" onClick={() => navigate("/register")}
            className="font-heading text-lg px-12 py-5 h-auto shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all">
            <Sparkles size={18} className="mr-2" />
            Solicitar minha vaga agora
          </Button>
          <p className="text-[11px] text-muted-foreground/50 mt-4">
            {currentTime.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} · Vagas limitadas
          </p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-border/30 px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground/50 font-heading">
          ✦ Portal Hogwarts House · Mundo Yasmin Caroline · 2026 ✦
        </p>
        <p className="text-[10px] text-muted-foreground/30 mt-1">
          Projeto de fã. Não afiliado à Warner Bros. ou J.K. Rowling.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <button onClick={() => navigate("/login")} className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">Entrar</button>
          <button onClick={() => navigate("/register")} className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">Cadastrar</button>
        </div>
      </footer>
    </div>
  );
}
