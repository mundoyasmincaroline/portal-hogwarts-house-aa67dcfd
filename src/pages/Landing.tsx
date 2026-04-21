import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Star, Zap, Crown, BookOpen, Users, ShoppingBag, Trophy, MessageCircle, Sparkles, Wand2, Shield, Flame } from "lucide-react";

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

const TESTIMONIALS = [
  { house: "gryffindor", emoji: "🦁", name: "Ana L.", quote: "Finalmente um portal que parece de verdade! Me sinto dentro de Hogwarts." },
  { house: "slytherin",  emoji: "🐍", name: "Marcos V.", quote: "As figurinhas são viciantes demais. Já completei metade do álbum!" },
  { house: "ravenclaw",  emoji: "🦅", name: "Julia R.", quote: "O sistema de Galeões e a loja são incríveis. Quero mais itens!" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 600);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => { clearTimeout(t); clearInterval(timer); window.removeEventListener("scroll", handleScroll); };
  }, []);

  useEffect(() => {
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .then(({ count }) => setMemberCount(Math.max(count ?? 0, 10)));
  }, []);

  const hour = new Date().getHours();
  let timeOfDay = "night";
  if (hour >= 5 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 18) timeOfDay = "afternoon";

  let bgUrl = "https://images.unsplash.com/photo-1547756536-cde3673fa2e5?q=80&w=2000"; // Night
  if (timeOfDay === "morning") bgUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000"; // Morning
  else if (timeOfDay === "afternoon") bgUrl = "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?q=80&w=2000"; // Afternoon

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] selection:bg-primary/30 selection:text-primary">
      <MagicalParticles />

      {/* ── PERSISTENT NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-6 md:px-12 flex items-center justify-between ${scrollY > 50 ? "bg-black/60 backdrop-blur-2xl border-b border-white/5 py-4" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => navigate("/")}>
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl transition-transform group-hover:scale-110">
               <Trophy size={24} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="font-heading text-2xl text-gold-gradient tracking-tighter block leading-none">Hogwarts</span>
            <span className="font-heading text-[10px] text-primary uppercase tracking-[0.4em] leading-none mt-1 block opacity-70">Portal Oficial</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={() => navigate("/login")} className="hidden md:block text-xs font-heading text-white/50 hover:text-white transition-colors tracking-widest uppercase">Entrar</button>
           <button onClick={() => navigate("/register")}
            className="group relative px-8 py-3 rounded-2xl bg-primary text-white font-heading text-xs tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(var(--primary),0.3)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10 flex items-center gap-2">SOLICITAR VAGA <ChevronRight size={14} /></span>
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION (MONSTER PARALLAX) ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-[120vh] transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0005})` }}
          >
            <img src={bgUrl} alt="Hogwarts Castle" className="w-full h-full object-cover opacity-60 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-[#050505]" />
          </div>
          
          {/* Magic Light Points */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>

        <div className={`relative z-20 w-full max-w-6xl transition-all duration-1000 delay-300 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}>
          
          {/* Floating Badge */}
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full px-6 py-2 mb-10 shadow-2xl animate-float">
             <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
             <span className="text-[10px] md:text-xs font-heading text-white/70 uppercase tracking-[0.4em]">Experiência Imersiva • Temporada 2024</span>
          </div>

          <h1 className="relative font-heading text-6xl sm:text-8xl md:text-[10rem] text-gold-gradient mb-4 tracking-tighter leading-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-1000">
            Hogwarts House
            <div className="absolute -top-10 -right-10 hidden lg:block animate-bounce-slow">
               <Sparkles size={60} className="text-yellow-400 opacity-30 blur-sm" />
            </div>
          </h1>

          <div className="flex flex-col items-center gap-6 mb-16">
             <div className="flex items-center justify-center gap-6">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <p className="text-xs md:text-lg font-heading text-primary uppercase tracking-[0.6em] opacity-90 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">Onde a Magia Ganha Vida</p>
                <div className="h-px w-24 bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
             </div>
             <p className="text-white/40 max-w-2xl text-sm md:text-base font-serif italic">
               "A carta que você sempre esperou não vem por correio coruja, ela está esperando por você aqui."
             </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center scale-110">
             <button 
              onClick={() => navigate("/register")}
              className="group relative px-16 py-6 rounded-3xl bg-primary text-white font-heading text-xl tracking-[0.2em] overflow-hidden shadow-[0_20px_50px_rgba(var(--primary),0.4)] hover:scale-105 hover:shadow-primary/60 transition-all active:scale-95">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center gap-4">
                 <Wand2 size={24} className="group-hover:rotate-12 transition-transform" />
                 ENTRAR NO CASTELO
                 <ChevronRight size={24} />
              </div>
            </button>
          </div>
        </div>

        {/* Scroll Down Hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
           <span className="text-[10px] font-heading tracking-widest text-white">DESCER</span>
           <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ── LIVE DATA BAR (MONSTER QUALITY) ── */}
      <div className="relative z-30 -mt-20 px-4">
         <div className="max-w-6xl mx-auto glass rounded-[4rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] p-10 md:p-14 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-yellow-500/5" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
               
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl border border-yellow-500/30 flex items-center justify-center shadow-2xl">
                        <Trophy size={32} className="text-yellow-400 animate-pulse" />
                     </div>
                     <div>
                        <h3 className="font-heading text-3xl text-white tracking-tighter">Copa das Casas</h3>
                        <p className="text-[10px] text-primary font-heading uppercase tracking-widest">Tempo Real • Temporada Atual</p>
                     </div>
                  </div>
                  <p className="text-white/40 text-sm leading-relaxed">
                    A cada feitiço lançado, a cada amizade feita e a cada desafio concluído, você traz glória para sua casa.
                  </p>
               </div>

               <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { name: "Grifinória", color: "from-red-600 to-red-950", progress: "65%", icon: "🦁", glow: "shadow-red-500/20" },
                    { name: "Sonserina", color: "from-green-500 to-green-950", progress: "82%", icon: "🐍", glow: "shadow-green-500/20" },
                    { name: "Corvinal", color: "from-blue-500 to-blue-950", progress: "45%", icon: "🦅", glow: "shadow-blue-500/20" },
                    { name: "Lufa-Lufa", color: "from-yellow-500 to-amber-950", progress: "30%", icon: "🦡", glow: "shadow-yellow-500/20" }
                  ].map((house) => (
                    <div key={house.name} className={`glass rounded-3xl p-6 border border-white/5 flex flex-col items-center gap-4 hover:bg-white/5 transition-all hover:-translate-y-2 shadow-xl ${house.glow}`}>
                       <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{house.icon}</span>
                       <div className="text-center">
                          <p className="text-[9px] font-heading text-white/30 uppercase mb-1">{house.name}</p>
                          <p className="font-heading text-xl text-white">{house.progress}</p>
                       </div>
                       <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full bg-gradient-to-r ${house.color}`} style={{ width: house.progress }} />
                       </div>
                    </div>
                  ))}
               </div>

            </div>
         </div>
      </div>

      {/* ── FEATURES (MONSTER QUALITY CARDS) ── */}
      <section className="relative z-10 px-6 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-heading text-[10px] tracking-[0.3em] uppercase">
              Recursos Exclusivos
           </div>
           <h2 className="font-heading text-5xl md:text-7xl text-white tracking-tighter">Muito além de um fórum</h2>
           <p className="text-white/40 max-w-2xl mx-auto text-lg">
             Criamos um ecossistema completo onde cada pixel foi desenhado para te fazer esquecer que você está no mundo dos trouxas.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <div key={i} className={`group relative glass rounded-[3rem] p-10 border border-white/10 transition-all duration-500 hover:-translate-y-4 hover:bg-white/[0.04] overflow-hidden ${f.color}`}>
              {/* Background Icon Watermark */}
              <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12 transition-transform group-hover:scale-150 group-hover:rotate-0 duration-700">
                 {f.icon}
              </div>
              
              <div className="relative z-10 space-y-6">
                 <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                    {f.icon}
                 </div>
                 <div className="space-y-3">
                    <h3 className="font-heading text-2xl text-white tracking-tight">{f.title}</h3>
                    <p className="text-white/40 leading-relaxed font-serif italic text-base">{f.desc}</p>
                 </div>
                 <div className="pt-4 flex items-center gap-2 text-[10px] font-heading text-primary uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
                    Explorar <ChevronRight size={12} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SHOP PREVIEW (MONSTER QUALITY) ── */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
         <div className="relative overflow-hidden rounded-[4rem] bg-gradient-to-br from-white/[0.05] to-black p-12 md:p-20 border border-yellow-500/20 shadow-[0_100px_150px_rgba(0,0,0,0.9)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div className="space-y-8">
                  <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-5 py-2">
                    <Crown size={18} className="text-yellow-400" />
                    <span className="text-xs font-heading text-yellow-400 uppercase tracking-widest">Loja Gringotts • Status VIP</span>
                  </div>
                  <h2 className="font-heading text-5xl md:text-7xl text-white tracking-tighter leading-none">
                    Economia <span className="text-gold-gradient">Mágica</span> Real
                  </h2>
                  <p className="text-white/50 text-xl leading-relaxed">
                    Ganhe Galeões participando de eventos, subindo de nível e completando desafios. Use seu ouro para comprar varinhas lendárias, mantos raros e itens que aumentam seu poder no RPG.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                     <Button variant="magical" size="lg" onClick={() => navigate("/register")} className="h-16 px-10 text-lg font-heading rounded-2xl shadow-yellow-500/20">
                        VER CATÁLOGO DA LOJA <ChevronRight size={18} className="ml-2" />
                     </Button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6 scale-110">
                  {[
                    { label: "Varinha das Varinhas", price: "2.500 🪙", icon: <Wand2 size={40} className="text-yellow-500" />, rarity: "LENDÁRIO" },
                    { label: "Manto da Invisibilidade", price: "4.000 🪙", icon: <Shield size={40} className="text-blue-500" />, rarity: "MÍSTICO" },
                    { label: "Vira-Tempo", price: "1.200 🪙", icon: <Sparkles size={40} className="text-purple-500" />, rarity: "EPICO" },
                    { label: "Ovo de Dragão", price: "5.000 🪙", icon: <Flame size={40} className="text-red-500" />, rarity: "LENDÁRIO" }
                  ].map((item, i) => (
                    <div key={i} className="glass rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group cursor-pointer text-center space-y-4">
                       <div className="w-20 h-20 mx-auto bg-black/40 rounded-3xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                          {item.icon}
                       </div>
                       <div>
                          <p className="text-[10px] font-heading text-primary uppercase mb-1 tracking-widest">{item.rarity}</p>
                          <h4 className="font-heading text-lg text-white mb-2">{item.label}</h4>
                          <p className="text-yellow-400 font-heading text-sm">{item.price}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* ── FINAL CALL TO ACTION ── */}
      <section className="relative z-10 px-6 py-40 text-center">
         <div className="max-w-4xl mx-auto space-y-12">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-primary/40 blur-3xl rounded-full animate-pulse" />
               <div className="relative z-10 text-[10rem] animate-float">✉️</div>
            </div>
            <div className="space-y-4">
               <h2 className="font-heading text-6xl md:text-9xl text-gold-gradient tracking-tighter drop-shadow-2xl">
                 A carta chegou.
               </h2>
               <p className="text-white/40 text-2xl font-serif italic max-w-2xl mx-auto">
                 "Não espere mais. O Expresso de Hogwarts parte em poucos minutos e sua vaga no grande salão está garantida."
               </p>
            </div>
            <div className="pt-8 flex flex-col items-center gap-6">
               <Button variant="magical" size="lg" onClick={() => navigate("/register")} 
                 className="h-20 px-16 text-2xl font-heading rounded-3xl shadow-[0_25px_60px_rgba(var(--primary),0.4)] hover:scale-105 transition-all">
                 ENTRAR AGORA <ChevronRight size={24} className="ml-2" />
               </Button>
               <div className="flex items-center gap-6 text-white/30 font-heading text-xs tracking-[0.3em] uppercase">
                  <span>✨ Registro Gratuito</span>
                  <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                  <span>🔮 RPG Ativo 24/7</span>
                  <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                  <span>🏰 Comunidade Secreta</span>
               </div>
            </div>
         </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-3xl px-6 py-12">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
               <Trophy size={24} className="text-yellow-400" />
               <div className="text-left">
                  <p className="font-heading text-lg text-white tracking-tighter">Hogwarts House</p>
                  <p className="text-[10px] text-white/30 font-heading uppercase tracking-widest">✦ Mundo Yasmin Caroline ✦</p>
               </div>
            </div>
            
            <div className="flex gap-8">
               <button onClick={() => navigate("/rules")} className="text-[10px] font-heading text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors">Termos & Regras</button>
               <button onClick={() => navigate("/login")} className="text-[10px] font-heading text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors">Acesso ao Castelo</button>
               <button onClick={() => navigate("/register")} className="text-[10px] font-heading text-primary hover:text-white uppercase tracking-[0.2em] transition-colors">Solicitar Vaga</button>
            </div>

            <p className="text-[9px] text-white/20 max-w-xs text-center md:text-right italic">
              Este é um projeto de fãs para fãs. Harry Potter e todos os personagens são marcas registradas da Warner Bros. Entertainment.
            </p>
         </div>
      </footer>

      {/* Background Noise Layer */}
      <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
    </div>
  );
}
igate("/register")} className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">Cadastrar</button>
        </div>
      </footer>
    </div>
  );
}
