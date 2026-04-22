import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  Sparkles, 
  MessageCircle, 
  Video, 
  Mic, 
  Camera, 
  Flame, 
  Star, 
  Users, 
  Send,
  Image as ImageIcon,
  MoreVertical,
  Plus,
  ArrowLeft,
  Volume2
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MagicalEmoji from "@/components/MagicalEmoji";
import SafeImage from "@/components/SafeImage";
import BFFChat from "@/components/BFFChat";

/**
 * BFFWorld: O santuário luxuoso da Yasmin e suas melhores amigas (Anita Potter & Cia).
 * Um espaço premium com interações multimídia e o Vínculo de Fogo (Streaks).
 */
const BFFWorld: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [anita, setAnita] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Acesso exclusivo para Yasmin e amigos permitidos
  const isYasmin = (profile?.username?.toLowerCase() || '').includes('yasmin') || profile?.username === 'morpheus';

  useEffect(() => {
    // Buscar perfil da Anita Potter
    const fetchAnita = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", "anitapotter")
        .maybeSingle();
      if (data) {
        setAnita(data);
        // Buscar streak do relacionamento
        if (user) {
          const { data: fData } = await supabase
            .from("friendships")
            .select("streak_count")
            .or(`and(user_id.eq.${user.id},friend_id.eq.${data.user_id}),and(user_id.eq.${data.user_id},friend_id.eq.${user.id})`)
            .maybeSingle();
          if (fData) setStreak(fData.streak_count || 0);
        }
      }
    };
    fetchAnita();

    // Mock messages iniciais
    setMessages([
      { sender: 'anita', text: "Yaaaas! Amiga, você viu o novo decreto que o Arquiteto postou? Tá babado! 💅✨", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
      { sender: 'anita', text: "Tô aqui no Beco Diagonal escolhendo uns acessórios pra gente usar no baile. O que você acha desse sapato de cristal? 👠✨", timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() }
    ]);
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const newMsg = { sender: 'yasmin', text: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    
    // Simulação de resposta da Anita
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "OMG sim!! 😍",
        "Você sempre tem as melhores ideias, Yas!",
        "Tô morrendo de saudade, vamos fazer call depois?",
        "Amei! Vou postar no InstaHogwarts agora!",
        "Nossa BFF é pra sempre mesmo, olha esse foguinho subindo! 🔥✨"
      ];
      const anitaMsg = { 
        sender: 'anita', 
        text: responses[Math.floor(Math.random() * responses.length)], 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, anitaMsg]);
      toast.success("Anita Potter está digitando...");
    }, 2000);
  };

  if (!isYasmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass p-10 rounded-[2rem] border-2 border-pink-500/30 max-w-md animate-pulse">
          <Heart className="text-pink-500 mx-auto mb-4" size={40} />
          <h1 className="font-heading text-3xl text-pink-500 mb-2">SANTUÁRIO PRIVADO</h1>
          <p className="text-muted-foreground font-serif italic text-sm">
            "Este é o Mundo das BFFs da Yasmin. Apenas convidados de honra podem entrar."
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0508] text-pink-400 font-heading selection:bg-pink-600 selection:text-white p-4 md:p-8 relative overflow-hidden">
      {/* Background Mágico Premium */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(219,39,119,0.1),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(234,179,8,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Header Luxuoso */}
        <div className="glass rounded-[2.5rem] border-pink-500/30 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-pink-950/20 via-black to-amber-950/10 shadow-[0_20px_50px_rgba(219,39,119,0.15)]">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/dashboard")} className="p-3 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 transition-all border border-pink-500/20">
              <ArrowLeft size={20} />
            </button>
            <div className="relative group">
              <div className="absolute inset-[-4px] bg-pink-500/20 rounded-full blur-md animate-pulse" />
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-pink-500 overflow-hidden shadow-[0_0_30px_rgba(219,39,119,0.4)] relative z-10">
                <SafeImage src={profile?.avatar_url} fallbackText="Y" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1.5 border border-pink-500 z-20 shadow-xl">
                <Heart size={16} className="text-pink-500 fill-pink-500" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-200 to-amber-200 drop-shadow-sm">
                Mundo das BFFs
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-pink-400/80 uppercase tracking-[0.3em] font-bold bg-pink-900/20 px-3 py-1 rounded-full border border-pink-900/40 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" /> Espaço Yasmin & Anita
                </span>
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-950/20 px-3 py-1 rounded-full border border-amber-900/40">
                    <Flame size={14} className="fill-amber-500 animate-bounce" /> {streak}d Vínculo de Fogo
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-12 border-pink-500/30 text-pink-400 bg-pink-500/5 hover:bg-pink-500/10 rounded-2xl gap-2">
                <Users size={18} /> + AMIGAS
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[750px]">
          {/* Chat Multimídia - O "WhatsApp" das BFFs */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <BFFChat />
          </div>

          {/* Sidebar - Conexões e Atividades BFF */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Vínculo de Fogo - Chama Eterna */}
            <div className="glass bg-gradient-to-b from-amber-950/20 to-black border-amber-900/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-600/10 blur-[50px] group-hover:bg-amber-600/20 transition-all" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Flame size={16} fill="currentColor" /> Vínculo de Fogo
                  </h3>
                  <p className="text-xl font-heading text-white mt-2">Chama de Fênix</p>
                </div>
                <div className="text-4xl animate-pulse">🔥</div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/60 border border-amber-900/40">
                   <div className="flex justify-between text-[10px] font-bold text-amber-500 uppercase mb-2">
                     <span>Nível da Chama</span>
                     <span>{streak > 0 ? streak : 0} Dias</span>
                   </div>
                   <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-amber-900/20">
                     <div 
                      className="h-full bg-gradient-to-r from-amber-900 via-amber-500 to-yellow-400 animate-shimmer" 
                      style={{ width: `${Math.min(100, (streak / 30) * 100)}%` }} 
                     />
                   </div>
                   <p className="text-[9px] text-amber-500/50 mt-2 italic">
                     {streak > 0 ? "A chama está brilhante! Continuem assim." : "Inicie uma conversa para acender a chama!"}
                   </p>
                </div>
              </div>
              
              <Button variant="plaque" className="w-full mt-6 border-amber-500/30 text-amber-500 h-12 gap-2 uppercase text-[10px] tracking-widest font-bold">
                 <Sparkles size={14} /> Reivindicar Bônus BFF
              </Button>
            </div>

            {/* Mural de Memórias */}
            <div className="glass bg-black/40 border-pink-900/20 p-8 rounded-[2.5rem] space-y-6 shadow-xl">
              <h3 className="text-xs font-bold text-pink-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <ImageIcon size={16} /> Mural de Memórias
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200", label: "Baile de Inverno" },
                  { img: "https://images.unsplash.com/photo-1547394765-185e1e68f34e?q=80&w=200", label: "Aula de Poções" },
                  { img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=200", label: "Astronomia" },
                  { img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=200", label: "Hogsmeade" },
                ].map((mem, i) => (
                  <div key={i} className="group relative rounded-2xl overflow-hidden aspect-square border-2 border-pink-900/20 hover:border-pink-500/50 transition-all cursor-pointer shadow-lg">
                    <img src={mem.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={mem.label} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                       <p className="text-[8px] font-bold text-pink-300 uppercase tracking-tighter">{mem.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-pink-900/20 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-pink-900/40 flex items-center justify-center text-[10px] text-pink-300 font-bold">Y</div>
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-pink-900/40 flex items-center justify-center text-[10px] text-pink-300 font-bold">A</div>
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-pink-900/40 flex items-center justify-center text-[10px] text-pink-300 font-bold hover:bg-pink-500 transition-colors cursor-pointer"><Plus size={12} /></div>
                </div>
                <span className="text-[10px] text-pink-500/50 font-bold uppercase tracking-widest">Grupo das BFFs</span>
              </div>
            </div>

            {/* Dica da Emma (Assistente) */}
            <div className="glass bg-pink-500/5 border-pink-500/20 p-6 rounded-[2rem] flex items-start gap-4 animate-float">
               <div className="p-2 bg-pink-500/10 rounded-xl text-pink-500">
                  <Volume2 size={20} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-1">Dica da Emma</p>
                  <p className="text-[11px] text-pink-200/60 leading-relaxed italic">
                    "Yas, as interações de vídeo e áudio dão 3x mais pontos para a sua Chama de Fênix! Que tal chamar a Anita?"
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default BFFWorld;
