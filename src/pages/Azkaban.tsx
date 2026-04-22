import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Clock, Zap } from "lucide-react";
import MagicalEmoji from "@/components/MagicalEmoji";

export default function Azkaban() {
  const { user, profile } = useAuth();
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

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2, "0")}s`;
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground animate-pulse">Carregando...</div>;

  const isInAzkaban = azkabanStatus && timeLeft > 0;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* HD Background with flare effect */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=2048"
          alt="Azkaban"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Flare effect top-left */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-blue-500/20 via-transparent to-transparent rounded-full blur-3xl" />
        {/* Flare effect top-right */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-cyan-400/15 via-transparent to-transparent rounded-full blur-2xl" />
        {/* Blue mist at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-blue-950/60 to-transparent" />
        {/* Lightning flare pulse */}
        <div className="absolute inset-0 animate-pulse-slow opacity-20 bg-gradient-to-br from-blue-900/30 via-transparent to-slate-900/30" />
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-auto px-4 py-16 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 flex flex-col items-center">
          <MagicalEmoji emoji="⛓️" size="lg" glowColor="rgba(59, 130, 246, 0.4)" className="animate-pulse" />
          <h1 className="font-heading text-5xl md:text-6xl text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]">
            Azkaban
          </h1>
          <p className="text-blue-200/80 text-lg font-serif italic">
            "A prisão dos bruxos. Onde os dementadores sugam toda alegria."
          </p>
        </div>

        {/* Status Card */}
        {isInAzkaban ? (
          <div className="glass rounded-2xl p-8 border border-blue-500/30 bg-blue-950/40 backdrop-blur-md text-center space-y-6">
            <div className="flex items-center justify-center gap-3 text-blue-300">
              <Clock size={24} />
              <span className="font-heading text-2xl">Você está em Azkaban</span>
            </div>
            <div className="text-6xl font-heading text-white font-bold tracking-widest">
              {formatTime(timeLeft)}
            </div>
            <p className="text-blue-200/70 text-sm">
              Você foi enviado para Azkaban por inatividade excessiva. 
              Aguarde o tempo acabar para ser libertado pelo Filch.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
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
            <p className="text-muted-foreground text-sm">
              Você não está em Azkaban. Continue participando do portal para evitar punições!
            </p>
            <Button variant="magical" onClick={() => navigate("/dashboard")} className="h-12 px-8 rounded-xl shadow-2xl">
              Voltar ao Castelo <MagicalEmoji emoji="🏰" size="xs" className="ml-2 inline-flex" />
            </Button>
          </div>
        )}

        {/* Guia — Como não ir para Azkaban */}
        <div className="glass rounded-2xl border border-amber-500/20 bg-amber-950/10 backdrop-blur-md overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <h2 className="font-heading text-xl text-amber-400 flex items-center gap-2">
              <AlertTriangle size={20} />
              Guia — Como Evitar Azkaban
            </h2>
            <p className="text-muted-foreground text-xs mt-1">Leia com atenção. Ninguém quer visitar os dementadores.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {[
                {
                  stage: "⚠️ Aviso 1",
                  time: "Após 3 dias sem atividade",
                  desc: "O Filch envia uma notificação de aviso. Nenhuma penalidade ainda.",
                  color: "border-yellow-500/30 bg-yellow-900/10",
                  text: "text-yellow-400",
                },
                {
                  stage: "💸 Penalidade de XP",
                  time: "Após 5 dias sem atividade",
                  desc: "Você perde XP por inatividade. Filch fica cada vez mais irritado.",
                  color: "border-orange-500/30 bg-orange-900/10",
                  text: "text-orange-400",
                },
                {
                  stage: "⚠️ Aviso Final",
                  time: "Após 7 dias sem atividade",
                  desc: "Último aviso antes da prisão. Mais XP é penalizado.",
                  color: "border-red-500/30 bg-red-900/10",
                  text: "text-red-400",
                },
                {
                  stage: "⛓️ Azkaban!",
                  time: "Após 10+ dias sem atividade",
                  desc: "Você é enviado para Azkaban por 1 hora. Acesso ao portal fica restrito.",
                  color: "border-blue-500/30 bg-blue-900/20",
                  text: "text-blue-300",
                },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl p-4 border ${s.color}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-heading text-sm ${s.text}`}>{s.stage}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full whitespace-nowrap shrink-0">{s.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4 border border-primary/30 bg-primary/5 mt-4">
              <p className="font-heading text-sm text-primary flex items-center gap-2">
                <Zap size={14} /> Como escapar do radar do Filch:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>✅ Acesse o portal pelo menos uma vez a cada 2 dias</li>
                <li>✅ Participe de chats, InstaHogwarts ou desafios</li>
                <li>✅ Complete aulas e missões para ganhar XP</li>
                <li>✅ Curta e comente posts no feed</li>
                <li>✅ Avise nos chats se for ficar ausente (aviso de viagem)</li>
              </ul>
            </div>
          </div>
        </div>

        {!isInAzkaban && (
          <div className="text-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="border-blue-500/30 text-blue-300 hover:bg-blue-900/20">
              ← Voltar ao Castelo
            </Button>
          </div>
        )}
      </div>

      {/* CSS flare animation */}
      <style>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.3; } }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .bg-gradient-radial { background-image: radial-gradient(var(--tw-gradient-stops)); }
      `}</style>
    </div>
  );
}
