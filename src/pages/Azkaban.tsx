import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Clock, Zap } from "lucide-react";
import MagicalEmoji from "@/components/shared/MagicalEmoji";
import { toast } from "sonner";
import EmojiIcon from "@/components/shared/EmojiIcon";

export default function Azkaban() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [azkabanStatus, setAzkabanStatus] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("azkaban_status")
        .select("*")
        .eq("user_id", user.id)
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
    load();
  }, [user]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t);
        if (user && azkabanStatus?.id) {
          supabase.from("azkaban_status").update({ active: false } as never).eq("id", azkabanStatus.id).then(() => {
            setAzkabanStatus(null);
            toast.success("Você foi libertado de Azkaban! ✨");
            navigate("/dashboard");
          });
        } else {
          setAzkabanStatus(null);
          navigate("/dashboard");
        }
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [timeLeft, user, azkabanStatus?.id, navigate]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2, "0")}s`;
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground animate-pulse">Carregando...</div>;

  const isInAzkaban = !!azkabanStatus && (timeLeft > 0 || !azkabanStatus.release_at);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img src="/azkaban_v2.png" alt="Azkaban" className="w-full h-full object-cover scale-110 animate-subtle-zoom" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-blue-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[1px] h-full bg-blue-400 opacity-0 animate-lightning-strike" />
          <div className="absolute top-0 right-1/3 w-[1px] h-full bg-cyan-300 opacity-0 animate-lightning-strike delay-700" />
          <div className="absolute top-0 left-1/2 w-[2px] h-full bg-white opacity-0 animate-lightning-strike delay-2000" />
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40 animate-pulse-slow" />
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 animate-lightning-flare" />
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-auto px-2 sm:px-4 py-16 space-y-6 sm:space-y-8">
        <div className="text-center space-y-4 flex flex-col items-center">
          <MagicalEmoji emoji="⛓️" size="lg" glowColor="rgba(59, 130, 246, 0.4)" className="animate-pulse" />
          <h1 className="font-heading text-5xl md:text-6xl text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]">Azkaban</h1>
          <p className="text-blue-200/80 text-lg font-serif italic">"A prisão dos bruxos. Onde os dementadores sugam toda alegria."</p>
        </div>

        {isInAzkaban ? (
          <div className="glass rounded-2xl p-6 sm:p-8 border border-blue-500/30 bg-blue-950/40 backdrop-blur-md text-center space-y-6">
            <div className="flex items-center justify-center gap-3 text-blue-300">
              <Clock size={24} />
              <span className="font-heading text-2xl">Você está em Azkaban</span>
            </div>
            <div className="text-4xl sm:text-7xl font-heading text-white font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">{formatTime(timeLeft)}</div>
            <div className="flex flex-col gap-2">
              <p className="text-blue-200/70 text-sm">Você foi enviado para Azkaban por inatividade excessiva. Aguarde o tempo acabar para ser libertado pelo Filch.</p>
              <Button variant="outline" size="sm" onClick={() => navigate("/support")} className="w-fit mx-auto border-blue-500/30 text-blue-300 hover:bg-blue-500/10">
                <Shield className="w-4 h-4 mr-1" /> Apelar ao Ministério
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Libertação prevista: <span className="text-blue-300">{azkabanStatus?.release_at ? new Date(azkabanStatus.release_at).toLocaleString() : "Indefinida"}</span></p>
              <p>Motivo: <span className="text-blue-300">{azkabanStatus?.reason || "Inatividade"}</span></p>
              <p>Penalidade XP aplicada: <span className="text-red-400">-{azkabanStatus?.xp_penalty || 0} XP</span></p>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 border border-green-500/30 bg-green-950/20 backdrop-blur-md text-center space-y-4">
            <div className="flex items-center justify-center gap-3 text-green-400">
              <Shield size={24} />
              <span className="font-heading text-xl">Você está livre!</span>
            </div>
            <p className="text-muted-foreground text-sm">Você não está em Azkaban. Continue participando do portal para evitar punições!</p>
            <Button variant="plaque" onClick={() => navigate("/dashboard")} className="min-h-12 h-auto px-5 sm:px-8 rounded-xl">
              Voltar ao Castelo <MagicalEmoji emoji="🏰" size="xs" className="ml-2 inline-flex" />
            </Button>
          </div>
        )}

        <div className="glass rounded-2xl border border-amber-500/20 bg-amber-950/10 backdrop-blur-md overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <h2 className="font-heading text-xl text-amber-400 flex items-center gap-2"><AlertTriangle size={20} /> Guia — Como Evitar Azkaban</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {[
                { stage: "⚠️ Aviso 1", time: "3 dias", desc: "Notificação do Filch.", color: "border-yellow-500/30 bg-yellow-900/10", text: "text-yellow-400" },
                { stage: "💸 XP", time: "5 dias", desc: "Penalidade inicial.", color: "border-orange-500/30 bg-orange-900/10", text: "text-orange-400" },
                { stage: "⛓️ Prisão", time: "10+ dias", desc: "Transferência direta.", color: "border-blue-500/30 bg-blue-900/20", text: "text-blue-300" }
              ].map((s, i) => (
                <div key={i} className={`rounded-xl p-4 border ${s.color}`}>
                  <div className="flex justify-between">
                    <div><p className={`font-heading text-sm ${s.text}`}>{s.stage}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                    <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full h-fit">{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes subtle-zoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        @keyframes lightning-strike { 0%, 95%, 100% { opacity: 0; } 96% { opacity: 0.8; } 97% { opacity: 0; } }
        .animate-subtle-zoom { animation: subtle-zoom 30s ease-in-out infinite alternate; }
        .animate-lightning-strike { animation: lightning-strike 5s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
