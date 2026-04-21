import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Clock, Zap, Flame, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import MagicalParticles from "@/components/MagicalParticles";

const RIDDLES = [
  { q: "O que é que você pode quebrar sem nunca tocá-lo ou pegá-lo?", a: "promessa" },
  { q: "Quanto mais você tira dele, maior ele fica. O que é?", a: "buraco" },
  { q: "Eu sou alto quando jovem e baixo quando velho. O que sou?", a: "vela" },
  { q: "Sou o guardião do segredo de uma casa, mas nunca falo. Quem sou?", a: "fiel do segredo" },
  { q: "Posso voar sem asas e chorar sem olhos. O que sou?", a: "nuvem" }
];

export default function Azkaban() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [azkabanStatus, setAzkabanStatus] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Game States
  const [gameMode, setGameMode] = useState<"none" | "duel" | "riddle">("none");
  const [dementors, setDementors] = useState<{ id: number, x: number, y: number }[]>([]);
  const [hits, setHits] = useState(0);
  const [riddle, setRiddle] = useState<any>(null);
  const [riddleAnswer, setRiddleAnswer] = useState("");

  useEffect(() => {
    if (!user) return;
    loadStatus();
  }, [user]);

  const loadStatus = async () => {
    const { data } = await supabase
      .from("azkaban_status")
      .select("*")
      .eq("user_id", user?.id)
      .eq("active", true)
      .maybeSingle();
    setAzkabanStatus(data);
    if (data?.release_at) {
      const release = new Date(data.release_at).getTime();
      const now = Date.now();
      setTimeLeft(Math.max(0, Math.floor((release - now) / 1000)));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { 
        clearInterval(t); 
        loadStatus();
        return 0; 
      }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2, "0")}s`;
  };

  // --- Dementor Duel Logic ---
  const startDuel = () => {
    setGameMode("duel");
    setHits(0);
    spawnDementor();
  };

  const spawnDementor = () => {
    const newDementor = {
      id: Date.now(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20
    };
    setDementors([newDementor]);
  };

  const hitDementor = () => {
    setHits(prev => {
      const next = prev + 1;
      if (next >= 5) {
        finishDuel();
        return next;
      }
      spawnDementor();
      return next;
    });
  };

  const finishDuel = async () => {
    setGameMode("none");
    setDementors([]);
    const bonusSeconds = 300; // 5 minutes off
    setTimeLeft(prev => Math.max(0, prev - bonusSeconds));
    toast.success("EXPECTO PATRONUM! Você espantou os dementadores e reduziu sua pena em 5 minutos! ✨");
    
    // Update release_at in DB
    const newRelease = new Date(Date.now() + (timeLeft - bonusSeconds) * 1000);
    await supabase.from("azkaban_status").update({ release_at: newRelease.toISOString() }).eq("id", azkabanStatus.id);
  };

  // --- Riddle Logic ---
  const startRiddle = () => {
    const random = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    setRiddle(random);
    setGameMode("riddle");
  };

  const checkRiddle = async () => {
    if (riddleAnswer.toLowerCase().includes(riddle.a)) {
      const bonusSeconds = 600; // 10 minutes off
      setTimeLeft(prev => Math.max(0, prev - bonusSeconds));
      toast.success("O Guardião está impressionado! 10 minutos removidos da sua pena. 📜");
      setGameMode("none");
      setRiddleAnswer("");
      
      const newRelease = new Date(Date.now() + (timeLeft - bonusSeconds) * 1000);
      await supabase.from("azkaban_status").update({ release_at: newRelease.toISOString() }).eq("id", azkabanStatus.id);
    } else {
      toast.error("Resposta errada... Os dementadores se aproximam.");
    }
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground animate-pulse font-heading tracking-widest">TRANSPONDO AS GRADES...</div>;

  const isInAzkaban = azkabanStatus && timeLeft > 0;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      <MagicalParticles />
      
      {/* Dark Atmosphere Layers */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=2048"
          alt="Azkaban"
          className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950/90 to-black" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        
        {/* Ethereal Blue Glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
             <div className="text-8xl mb-4 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">⛓️</div>
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-6xl md:text-8xl text-white tracking-tighter drop-shadow-2xl">
              Azkaban
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-blue-500/50" />
              <p className="text-blue-400 font-heading text-xs tracking-[0.5em] uppercase">Setor de Segurança Máxima</p>
              <div className="h-px w-16 bg-blue-500/50" />
            </div>
          </div>
        </div>

        {isInAzkaban ? (
          <div className="space-y-8">
            {/* Status Card */}
            <div className="relative overflow-hidden rounded-[3rem] bg-black/60 backdrop-blur-3xl border border-blue-500/30 p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-center group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-pulse">
                  <Clock size={18} />
                  <span className="font-heading text-sm tracking-widest uppercase">Pena em curso</span>
                </div>
                
                <div className="text-7xl md:text-9xl font-heading text-white font-bold tracking-tighter drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                  {formatTime(timeLeft)}
                </div>
                
                <div className="max-w-md mx-auto space-y-4">
                  <p className="text-blue-200/50 text-sm font-serif italic leading-relaxed">
                    "O frio é insuportável, mas a sua determinação pode ser a luz que afasta a escuridão."
                  </p>
                  <div className="flex items-center justify-center gap-6 text-[10px] font-heading uppercase tracking-widest text-white/30 pt-4 border-t border-white/5">
                    <span>Motivo: <span className="text-blue-400">{azkabanStatus?.reason || "Inatividade"}</span></span>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <span>Penalidade: <span className="text-red-500">-{azkabanStatus?.xp_penalty || 0} XP</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Redenção Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden group bg-gradient-to-b from-blue-900/20 to-black/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-500 cursor-pointer" onClick={gameMode === "none" ? startDuel : undefined}>
                 <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/40">
                       <Wand2 size={24} />
                    </div>
                    <div>
                       <h3 className="font-heading text-xl text-white">Duelo de Patrono</h3>
                       <p className="text-xs text-blue-200/40 mt-1 uppercase tracking-widest font-heading">Espante os dementadores</p>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">Mostre sua força de vontade e reduza <span className="text-blue-400 font-bold">5 minutos</span> da sua pena.</p>
                 </div>
                 {gameMode === "duel" && (
                   <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                      <p className="text-xs text-blue-400 font-heading mb-8 animate-pulse tracking-widest">FOQUE NA SUA LEMBRANÇA MAIS FELIZ!</p>
                      {dementors.map(d => (
                        <button 
                          key={d.id}
                          className="absolute w-20 h-20 text-4xl animate-bounce"
                          style={{ left: `${d.x}%`, top: `${d.y}%` }}
                          onClick={(e) => { e.stopPropagation(); hitDementor(); }}
                        >
                          👻
                        </button>
                      ))}
                      <div className="mt-auto w-full bg-white/5 rounded-full h-1 overflow-hidden">
                         <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${(hits/5)*100}%` }} />
                      </div>
                   </div>
                 )}
              </div>

              <div className="relative overflow-hidden group bg-gradient-to-b from-slate-900/20 to-black/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 hover:border-amber-500/50 transition-all duration-500 cursor-pointer" onClick={gameMode === "none" ? startRiddle : undefined}>
                 <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/40">
                       <Scroll size={24} />
                    </div>
                    <div>
                       <h3 className="font-heading text-xl text-white">Enigma do Guardião</h3>
                       <p className="text-xs text-amber-200/40 mt-1 uppercase tracking-widest font-heading">Teste sua sabedoria</p>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">Responda corretamente para remover <span className="text-amber-400 font-bold">10 minutos</span> da sua pena.</p>
                 </div>
                 {gameMode === "riddle" && (
                   <div className="absolute inset-0 z-20 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
                      <p className="text-xs text-amber-400 font-heading mb-4 uppercase tracking-widest">O Guardião Pergunta:</p>
                      <p className="text-lg text-white font-serif italic mb-6 leading-relaxed">"{riddle?.q}"</p>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-serif mb-4 focus:outline-none focus:border-amber-500/50"
                        placeholder="Sua resposta..."
                        value={riddleAnswer}
                        onChange={e => setRiddleAnswer(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && checkRiddle()}
                      />
                      <div className="flex gap-2">
                         <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setGameMode("none"); }}>Desistir</Button>
                         <Button variant="magical" size="sm" onClick={(e) => { e.stopPropagation(); checkRiddle(); }}>Responder</Button>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[3rem] bg-green-500/5 backdrop-blur-3xl border border-green-500/20 p-12 text-center space-y-8 animate-in zoom-in duration-1000 shadow-2xl">
            <div className="w-24 h-24 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
              <Shield size={48} className="text-green-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-3xl text-white tracking-tighter uppercase">Você está livre!</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Sua ficha está limpa perante o Ministério da Magia. Continue honrando sua casa para evitar novas punições.
              </p>
            </div>
            <Button variant="magical" size="lg" onClick={() => navigate("/dashboard")} className="px-12 py-6 rounded-2xl shadow-xl shadow-green-500/10">
              Voltar ao Castelo 🏰
            </Button>
          </div>
        )}

        {/* Guia — Como não ir para Azkaban */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-2xl">
           <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                 <h2 className="font-heading text-xl text-white flex items-center gap-3">
                    <AlertTriangle size={20} className="text-amber-500" />
                    Código de Conduta de Hogwarts
                 </h2>
                 <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-heading mt-1">Avisos do Zelador Filch</p>
              </div>
           </div>
           <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { stage: "⚠️ Aviso 1", time: "3 Dias", desc: "Aviso formal por inatividade.", color: "border-yellow-500/20 bg-yellow-500/5", text: "text-yellow-500" },
                { stage: "💸 Multa", time: "5 Dias", desc: "Penalidade automática de XP.", color: "border-orange-500/20 bg-orange-500/5", text: "text-orange-500" },
                { stage: "🛑 Final", time: "7 Dias", desc: "Último chamado antes da prisão.", color: "border-red-500/20 bg-red-500/5", text: "text-red-500" },
                { stage: "⛓️ Prisão", time: "10+ Dias", desc: "Transferência para Azkaban.", color: "border-blue-500/20 bg-blue-500/5", text: "text-blue-500" },
              ].map((s, i) => (
                <div key={i} className={`rounded-2xl p-4 border ${s.color} transition-all hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className={`font-heading text-[10px] uppercase tracking-widest ${s.text}`}>{s.stage}</p>
                      <p className="text-xs text-white/80 font-medium">{s.desc}</p>
                    </div>
                    <span className="text-[10px] font-heading text-white/20 bg-white/5 px-3 py-1 rounded-full">{s.time}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {!isInAzkaban && (
          <div className="text-center opacity-40 hover:opacity-100 transition-opacity">
            <button onClick={() => navigate("/dashboard")} className="text-[10px] font-heading text-white uppercase tracking-[0.5em] flex items-center justify-center gap-2 mx-auto">
              ← Sair de Azkaban
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
