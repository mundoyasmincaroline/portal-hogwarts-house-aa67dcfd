import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMagicalSound } from "@/hooks/useMagicalSound";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Star, Zap, Crown, BookOpen, Users, ShoppingBag, Trophy, MessageCircle, Sparkles, Wand2, Shield, Flame, Menu, X } from "lucide-react";

const HOUSES: { id: House; name: string; color: string; animal: string; trait: string }[] = [
  { id: "gryffindor", name: "Grifinória", color: "from-red-900/80 to-yellow-900/60 border-red-500/50", animal: "🦁", trait: "Coragem & Bravura" },
  { id: "slytherin",  name: "Sonserina",  color: "from-green-900/80 to-slate-900/60 border-green-500/50", animal: "🐍", trait: "Ambição & Astúcia" },
  { id: "ravenclaw",  name: "Corvinal",   color: "from-blue-900/80 to-slate-900/60 border-blue-500/50", animal: "🦅", trait: "Sabedoria & Criatividade" },
  { id: "hufflepuff", name: "Lufa-Lufa",  color: "from-yellow-900/80 to-stone-900/60 border-yellow-500/50", animal: "🦡", trait: "Lealdade & Paciência" },
];

const FEATURES = [
  { icon: <Users size={24} className="text-blue-400" />, title: "Comunidade RPG", desc: "Feed, DMs, amigos e stories. Viva Hogwarts com outros fãs.", color: "border-blue-500/30 bg-blue-900/10" },
  { icon: <ShoppingBag size={24} className="text-yellow-400" />, title: "Gringotts Store", desc: "Mantos, varinhas, amuletos e itens mágicos com Galeões.", color: "border-yellow-500/30 bg-yellow-900/10" },
  { icon: <Trophy size={24} className="text-amber-400" />, title: "Álbum de Figurinhas", desc: "Colecione personagens raros e complete seu álbum mágico.", color: "border-amber-500/30 bg-amber-900/10" },
  { icon: <Zap size={24} className="text-purple-400" />, title: "Gamificação Extrema", desc: "XP, níveis, conquistas, ranking das casas e desafios diários.", color: "border-purple-500/30 bg-purple-900/10" },
  { icon: <Crown size={24} className="text-rose-400" />, title: "VIP & Recompensas", desc: "Planos VIP com Galeões mensais, skins exclusivas e badges.", color: "border-rose-500/30 bg-rose-900/10" },
  { icon: <MessageCircle size={24} className="text-green-400" />, title: "Chats & Casas", desc: "Salas de RPG por casa, missões coletivas e eventos ao vivo.", color: "border-green-500/30 bg-green-900/10" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { play } = useMagicalSound();
  const [showContent, setShowContent] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [stats, setStats] = useState({ wizards: 10, houses: 4, items: 28 });
  const [housePoints, setHousePoints] = useState<Record<string, number>>({
    gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0
  });
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 600);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => { clearTimeout(t); window.removeEventListener("scroll", handleScroll); };
  }, []);

  useEffect(() => {
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .then(({ count }) => setStats(prev => ({ ...prev, wizards: Math.max(count ?? 0, 10) })));
    supabase.from("products").select("*", { count: "exact", head: true })
      .then(({ count }) => setStats(prev => ({ ...prev, items: Math.max(count ?? 0, 28) })));
    supabase.from("house_points").select("house, points")
      .then(({ data }) => {
        if (data) {
          const p: Record<string, number> = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
          data.forEach(row => p[row.house] = (p[row.house] || 0) + row.points);
          setHousePoints(p);
        }
      });

    const target = new Date();
    target.setDate(target.getDate() + ((5 + 7 - target.getDay()) % 7 || 7));
    target.setHours(20, 0, 0, 0);
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = target.getTime() - now;
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = new Date().getHours();
  let timeOfDay = "night";
  if (hour >= 5 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 18) timeOfDay = "afternoon";

  const bgUrl = "/hogwarts_monster_hero_1776800242941.png";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] selection:bg-primary/30 selection:text-primary">
      <MagicalParticles />

      {/* ── PERSISTENT NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-4 md:px-12 flex items-center justify-between ${scrollY > 50 || mobileMenuOpen ? "bg-black/80 backdrop-blur-2xl border-b border-white/5 py-3 md:py-4" : "py-6 md:py-8"}`}>
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => navigate("/")}>
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl transition-transform group-hover:scale-110">
               <Trophy size={20} className="text-yellow-400 md:text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            </div>
          </div>
          <div>
            <span className="font-heading text-lg md:text-2xl text-gold-gradient tracking-tighter block leading-none">Hogwarts</span>
            <span className="font-heading text-[8px] md:text-[10px] text-primary uppercase tracking-[0.4em] leading-none mt-1 block opacity-70">Portal Oficial</span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
           <button onClick={() => navigate("/login")} className="text-[10px] font-heading text-white/50 hover:text-white transition-colors tracking-widest uppercase">Entrar</button>
           <button onClick={() => navigate("/register")}
            className="group relative px-8 py-3 rounded-2xl bg-primary text-white font-heading text-[10px] tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(var(--primary),0.3)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10 flex items-center gap-2">SOLICITAR VAGA <ChevronRight size={14} /></span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-white/70 hover:text-white transition-colors">
           {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Content */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-3xl border-b border-white/10 p-8 flex flex-col items-center gap-6 animate-in slide-in-from-top-10 duration-300 md:hidden">
             <button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="text-sm font-heading text-white/70 uppercase tracking-[0.2em]">Entrar no Castelo</button>
             <button onClick={() => { navigate("/register"); setMobileMenuOpen(false); }} className="w-full py-4 rounded-2xl bg-primary text-white font-heading text-sm tracking-widest">SOLICITAR MINHA VAGA</button>
             <div className="flex gap-6 mt-4">
                <span className="text-[10px] font-heading text-white/30 uppercase tracking-widest">Regras</span>
                <span className="text-[10px] font-heading text-white/30 uppercase tracking-widest">Sobre o Projeto</span>
             </div>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION (MONSTER PARALLAX) ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 md:pt-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-[120vh] transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0005})` }}
          >
            <img src={bgUrl} alt="Hogwarts Castle" className="w-full h-full object-cover opacity-60 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-[#050505]" />
          </div>
          
          {/* Magic Light Points */}
          <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/20 rounded-full blur-[100px] md:blur-[140px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-indigo-500/10 rounded-full blur-[80px] md:blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>

        <div className={`relative z-20 w-full max-w-6xl transition-all duration-1000 delay-300 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}>
          
          {/* Floating Badge - Next Gen */}
          <div className="inline-flex items-center gap-2 md:gap-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full px-4 md:px-6 py-2 mb-8 md:mb-12 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-float">
             <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-ping" />
             <span className="text-[8px] md:text-[10px] font-heading text-white tracking-[0.4em] uppercase">Mundo Aberto • Roleplay Imersivo</span>
          </div>

          <h1 className="relative font-heading text-6xl sm:text-7xl md:text-8xl lg:text-[13rem] text-gold-gradient mb-4 md:mb-6 tracking-tighter leading-[0.75] drop-shadow-[0_20px_60px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-1000 px-2 group cursor-default">
            <span className="animate-shimmer bg-[length:200%_auto] inline-block hover:scale-[1.02] transition-transform duration-700">Hogwarts</span><br/>
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] inline-block hover:scale-[1.02] transition-transform duration-700">House</span>
          </h1>

          <div className="flex flex-col items-center gap-4 md:gap-8 mb-14 md:mb-20 px-4">
             <div className="flex items-center justify-center gap-4 md:gap-8">
                <div className="h-[2px] w-12 md:w-32 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <p className="text-[10px] md:text-xl font-heading text-primary uppercase tracking-[0.4em] md:tracking-[0.8em] drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">Viva sua própria lenda</p>
                <div className="h-[2px] w-12 md:w-32 bg-gradient-to-l from-transparent via-primary/60 to-transparent" />
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center items-center scale-100 md:scale-110 px-6">
             <button 
              onClick={() => { play('click'); navigate("/register"); }}
              onMouseEnter={() => play('hover')}
              className="w-full sm:w-auto group relative px-12 md:px-20 py-5 md:py-8 rounded-2xl md:rounded-[2rem] bg-primary text-white font-heading text-sm md:text-2xl tracking-[0.3em] overflow-hidden shadow-[0_20px_50px_rgba(var(--primary),0.5)] hover:scale-105 hover:shadow-primary/70 transition-all duration-500 active:scale-95 border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-3 md:gap-5">
                 <Wand2 size={24} className="md:size-[32px] group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />
                 SOLICITAR VAGA
                 <ChevronRight size={24} className="md:size-[32px] group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Scroll Down Hint */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
           <span className="text-[8px] md:text-[10px] font-heading tracking-widest text-white">DESCER</span>
           <div className="w-px h-8 md:h-12 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ── LIVE DATA BAR (TRIPLE-A GLORY) ── */}
      <section className="relative z-30 -mt-10 md:-mt-24 px-4 md:px-6">
         <div className="max-w-7xl mx-auto glass rounded-[3rem] md:rounded-[5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] p-8 md:p-16 overflow-hidden relative group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.1),transparent_70%)]" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-center">
               
               <div className="lg:col-span-4 space-y-8 md:space-y-12 text-center lg:text-left">
                  <div className="space-y-4">
                     <div className="flex items-center justify-center lg:justify-start gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500/10 rounded-2xl border border-yellow-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                           <Trophy size={28} className="text-yellow-400 animate-pulse-glow" />
                        </div>
                        <div>
                           <h3 className="font-heading text-2xl md:text-3xl text-white tracking-tighter uppercase">Copa das Casas</h3>
                           <p className="text-[10px] font-heading text-primary uppercase tracking-[0.4em] opacity-60">Status de Glória • 2024</p>
                        </div>
                     </div>
                     <p className="text-white/40 text-xs md:text-base font-serif italic leading-relaxed">
                        "Onde cada ponto conquistado ecoa pelos corredores do castelo e consagra seu nome na história."
                     </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 md:gap-8 border-t border-white/5 pt-8">
                     <div className="text-center lg:text-left">
                        <p className="font-heading text-2xl md:text-4xl text-gold-gradient tracking-tighter leading-none">{stats.wizards}</p>
                        <p className="text-[8px] md:text-[10px] text-white/30 font-heading tracking-widest mt-2 uppercase">Lendas</p>
                     </div>
                     <div className="text-center lg:text-left">
                        <p className="font-heading text-2xl md:text-4xl text-gold-gradient tracking-tighter leading-none">4</p>
                        <p className="text-[8px] md:text-[10px] text-white/30 font-heading tracking-widest mt-2 uppercase">Casas</p>
                     </div>
                     <div className="text-center lg:text-left">
                        <p className="font-heading text-2xl md:text-4xl text-gold-gradient tracking-tighter leading-none">{stats.items}+</p>
                        <p className="text-[8px] md:text-[10px] text-white/30 font-heading tracking-widest mt-2 uppercase">Relíquias</p>
                     </div>
                  </div>

                  {/* Next Tournament - High End */}
                  <div className="relative overflow-hidden rounded-3xl bg-red-950/20 border border-red-500/20 p-6 group/event cursor-pointer hover:bg-red-950/30 transition-all duration-500">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/event:scale-125 transition-transform duration-700">
                        <Zap size={60} className="text-red-500" />
                     </div>
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-heading text-red-400 uppercase tracking-[0.3em]">Próximo Torneio</span>
                           <span className="text-[10px] font-heading text-white/40 italic">Baile de Inverno</span>
                        </div>
                        <div className="flex gap-4">
                           {[timeLeft.days, timeLeft.hours, timeLeft.mins, timeLeft.secs].map((t, i) => (
                              <div key={i} className="flex-1 text-center">
                                 <p className="text-2xl md:text-3xl font-heading text-white leading-none">{String(t).padStart(2, '0')}</p>
                                 <p className="text-[8px] text-white/20 font-heading mt-1">{['DIAS', 'HORAS', 'MINS', 'SEGS'][i]}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  {HOUSES.map((house) => {
                    const points = housePoints[house.id] || 0;
                    const maxPoints = Math.max(...Object.values(housePoints), 100);
                    const progress = (points / maxPoints) * 100;
                    return (
                      <div key={house.name} className={`glass rounded-[2rem] md:rounded-[3rem] p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] transition-all duration-700 hover:-translate-y-2 group/h shadow-2xl`}>
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <span className="text-4xl md:text-6xl group-hover/h:scale-110 transition-transform duration-700 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{house.animal}</span>
                              <div>
                                 <p className="text-[10px] md:text-xs font-heading text-white/30 uppercase tracking-[0.2em]">{house.name}</p>
                                 <h4 className="text-xl md:text-2xl font-heading text-white">{points} PTS</h4>
                              </div>
                           </div>
                           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        </div>
                        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[2px]">
                            <div 
                              className={`h-full rounded-full bg-gradient-to-r ${house.color} transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(var(--primary),0.3)]`} 
                              style={{ width: `${Math.max(progress, 5)}%` }} 
                            >
                               <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/h:opacity-100 transition-opacity animate-shimmer" />
                            </div>
                        </div>
                      </div>
                    );
                  })}
               </div>

            </div>
         </div>
      </section>

      {/* ── FEATURES (MONSTER QUALITY CARDS) ── */}
      <section className="relative z-10 px-6 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-20 space-y-3 md:space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-heading text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase">
              Recursos Exclusivos
           </div>
           <h2 className="font-heading text-3xl md:text-7xl text-white tracking-tighter leading-tight">Muito além de um fórum</h2>
           <p className="text-white/40 max-w-2xl mx-auto text-sm md:text-lg px-4">
             Criamos um ecossistema completo onde cada pixel foi desenhado para te fazer esquecer que você está no mundo dos trouxas.
           </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-2 md:px-0">
          {FEATURES.map((f, i) => (
            <div key={i} className={`group relative glass rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 border border-white/10 transition-all duration-500 hover:-translate-y-2 md:hover:-translate-y-4 hover:bg-white/[0.04] overflow-hidden ${f.color}`}>
              <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12 transition-transform group-hover:scale-150 group-hover:rotate-0 duration-700 pointer-events-none">
                 {f.icon}
              </div>
              
              <div className="relative z-10 space-y-4 md:space-y-6">
                 <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                    {f.icon}
                 </div>
                 <div className="space-y-2 md:space-y-3">
                    <h3 className="font-heading text-xl md:text-2xl text-white tracking-tight">{f.title}</h3>
                    <p className="text-white/40 leading-relaxed font-serif italic text-xs md:text-base">{f.desc}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SHOP PREVIEW (MONSTER QUALITY) ── */}
      <section className="relative z-10 px-4 md:px-6 py-12 md:py-20 max-w-7xl mx-auto">
         <div className="relative overflow-hidden rounded-[3rem] md:rounded-[4rem] bg-gradient-to-br from-white/[0.05] to-black p-8 md:p-20 border border-yellow-500/20 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
               <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 md:gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 md:px-5 py-1.5 md:py-2 mx-auto lg:mx-0">
                    <Crown size={16} className="text-yellow-400 md:text-yellow-400" />
                    <span className="text-[10px] md:text-xs font-heading text-yellow-400 uppercase tracking-widest">Loja Gringotts • Status VIP</span>
                  </div>
                  <h2 className="font-heading text-3xl md:text-7xl text-white tracking-tighter leading-tight md:leading-none">
                    Economia <span className="text-gold-gradient">Mágica</span> Real
                  </h2>
                  <p className="text-white/50 text-sm md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Ganhe Galeões participando de eventos, subindo de nível e completando desafios. Use seu ouro para comprar varinhas lendárias e mantos raros.
                  </p>
                  <Button variant="magical" onClick={() => navigate("/register")} className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 text-sm md:text-lg font-heading rounded-2xl shadow-yellow-500/20">
                     VER CATÁLOGO DA LOJA <ChevronRight size={16} className="ml-2" />
                  </Button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 scale-100 lg:scale-110">
                  {[
                    { label: "Varinha das Varinhas", price: "2.500 🪙", icon: <Wand2 size={32} className="text-yellow-500" />, rarity: "LENDÁRIO" },
                    { label: "Manto Invisibilidade", price: "4.000 🪙", icon: <Shield size={32} className="text-blue-500" />, rarity: "MÍSTICO" },
                    { label: "Vira-Tempo", price: "1.200 🪙", icon: <Sparkles size={32} className="text-purple-500" />, rarity: "EPICO" },
                    { label: "Ovo de Dragão", price: "5.000 🪙", icon: <Flame size={32} className="text-red-500" />, rarity: "LENDÁRIO" }
                  ].map((item, i) => (
                    <div key={i} className="glass rounded-[2rem] p-6 md:p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group cursor-pointer flex flex-row sm:flex-col items-center gap-4 sm:gap-4 text-left sm:text-center">
                       <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shrink-0">
                          {item.icon}
                       </div>
                       <div className="flex-1">
                          <p className="text-[8px] md:text-[10px] font-heading text-primary uppercase mb-0.5 tracking-widest">{item.rarity}</p>
                          <h4 className="font-heading text-sm md:text-lg text-white mb-1">{item.label}</h4>
                          <p className="text-yellow-400 font-heading text-xs md:text-sm">{item.price}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* ── FINAL CALL TO ACTION ── */}
      <section className="relative z-10 px-6 py-24 md:py-40 text-center">
         <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-primary/40 blur-2xl md:blur-3xl rounded-full animate-pulse" />
               <div className="relative z-10 text-7xl md:text-[10rem] animate-float">✉️</div>
            </div>
            <div className="space-y-3 md:space-y-4 px-2">
               <h2 className="font-heading text-3xl md:text-8xl text-gold-gradient tracking-tighter drop-shadow-2xl leading-tight">
                 A carta chegou.
               </h2>
               <p className="text-white/40 text-base md:text-2xl font-serif italic max-w-2xl mx-auto leading-relaxed">
                 "Não espere mais. O Expresso de Hogwarts parte em poucos minutos e sua vaga no grande salão está garantida."
               </p>
            </div>
            <div className="pt-4 md:pt-8 flex flex-col items-center gap-6 px-4">
               <Button variant="magical" size="lg" onClick={() => navigate("/register")} 
                 className="w-full sm:w-auto h-16 md:h-20 px-10 md:px-16 text-sm md:text-2xl font-heading rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:scale-105 transition-all">
                 ENTRAR AGORA <ChevronRight size={20} className="ml-2" />
               </Button>
               <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-white/30 font-heading text-[8px] md:text-xs tracking-[0.2em] uppercase px-4">
                  <span>✨ Registro Gratuito</span>
                  <div className="hidden sm:block w-1 h-1 bg-white/20 rounded-full" />
                  <span>🔮 RPG Ativo 24/7</span>
                  <div className="hidden sm:block w-1 h-1 bg-white/20 rounded-full" />
                  <span>🏰 Comunidade Secreta</span>
               </div>
            </div>
         </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-3xl px-6 py-10 md:py-12">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex items-center gap-4">
               <Trophy size={24} className="text-yellow-400" />
               <div>
                  <p className="font-heading text-lg text-white tracking-tighter">Hogwarts House</p>
                  <p className="text-[8px] md:text-[10px] text-white/30 font-heading uppercase tracking-widest">✦ Mundo Yasmin Caroline ✦</p>
               </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
               <button onClick={() => navigate("/rules")} className="text-[8px] md:text-[10px] font-heading text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors">Termos & Regras</button>
               <button onClick={() => navigate("/login")} className="text-[8px] md:text-[10px] font-heading text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors">Entrar</button>
               <button onClick={() => navigate("/register")} className="text-[8px] md:text-[10px] font-heading text-primary hover:text-white uppercase tracking-[0.2em] transition-colors">Cadastrar</button>
            </div>

            <p className="text-[8px] md:text-[9px] text-white/20 max-w-xs italic leading-relaxed">
              Este é um projeto de fãs para fãs. Harry Potter e todos os personagens são marcas registradas da Warner Bros. Entertainment.
            </p>
         </div>
      </footer>

      {/* Background Noise Layer */}
      <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
    </div>
  );
}
